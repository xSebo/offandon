'use server';

import { exec } from 'child_process';
import { promisify } from 'util';

export type DockerRun = {
  success: boolean;
  message: string;
  details: {
    down?: string;
    up?: string;
    error?: unknown;
  };
};

const execAsync = promisify(exec);

// Helper function to check if stderr contains actual errors
function containsActualError(stderr: string): boolean {
  // Ignore warnings about deprecated version
  if (stderr.includes('the attribute `version` is obsolete')) {
    return false;
  }

  // Add more warning patterns to ignore if needed
  const ignorablePatterns = ['warning', 'Warning', 'deprecat', 'Deprecat'];

  // Check if stderr contains any content that isn't just warnings
  const lines = stderr.split('\n').filter((line) => line.trim());
  const hasOnlyWarnings = lines.every((line) =>
    ignorablePatterns.some((pattern) => line.includes(pattern))
  );

  return !hasOnlyWarnings;
}

export async function restartDockerCompose(): Promise<DockerRun> {
  try {
    // Get user's home directory
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const composePath = `${homeDir}/QbitExpress`;

    // Execute docker-compose down
    const { stdout: downOutput, stderr: downError } = await execAsync(
      'docker compose down',
      {
        cwd: composePath,
      }
    );

    if (downError && containsActualError(downError)) {
      console.error('Error during docker compose down:', downError);
      throw new Error('Failed to stop containers');
    }

    // Wait for a brief moment to ensure all containers are properly stopped
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Execute docker-compose up -d
    const { stdout: upOutput, stderr: upError } = await execAsync(
      'docker compose up -d',
      {
        cwd: composePath,
      }
    );

    if (upError && containsActualError(upError)) {
      console.error('Error during docker compose up:', upError);
      throw new Error('Failed to start containers');
    }

    return {
      success: true,
      message: 'Docker containers successfully restarted',
      details: {
        down: downOutput,
        up: upOutput,
        // Include stderr as part of the details for debugging
        error:
          downError || upError
            ? `Down: ${downError}\nUp: ${upError}`
            : undefined,
      },
    };
  } catch (error) {
    console.error('Error restarting Docker containers:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
      details: { error: error },
    };
  }
}
