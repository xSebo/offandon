'use server';

import { spawn } from 'child_process';

export type DockerRun = {
  success: boolean;
  message: string;
  details: {
    down?: string;
    up?: string;
    error?: unknown;
  };
};

// Helper function to check if stderr contains actual errors
function containsActualError(stderr: string): boolean {
  if (stderr.includes('the attribute `version` is obsolete')) {
    return false;
  }

  const ignorablePatterns = ['warning', 'Warning', 'deprecat', 'Deprecat'];

  const lines = stderr.split('\n').filter((line) => line.trim());
  const hasOnlyWarnings = lines.every((line) =>
    ignorablePatterns.some((pattern) => line.includes(pattern))
  );

  return !hasOnlyWarnings;
}

// Helper to execute a command and stream logs
function executeCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { cwd });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(output); // Log stdout as it streams
    });

    process.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      stderr += errorOutput;
      console.error(errorOutput); // Log stderr as it streams
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

export async function restartDockerCompose(): Promise<DockerRun> {
  try {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const composePath = `${homeDir}/QbitExpress`;

    console.log('Stopping Docker containers...');
    const { stdout: downOutput, stderr: downError } = await executeCommand(
      'docker',
      ['compose', 'down'],
      composePath
    );

    if (downError && containsActualError(downError)) {
      console.error('Error during docker compose down:', downError);
      throw new Error('Failed to stop containers');
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('Starting Docker containers...');
    const { stdout: upOutput, stderr: upError } = await executeCommand(
      'docker',
      ['compose', 'up', '-d'],
      composePath
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
