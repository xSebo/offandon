'use client';
import { restartDockerCompose } from '@/runners/docker';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EasyAlert } from '@/components/easy-alert';
import { LoaderCircle } from 'lucide-react';

export function SpinnyButton() {
  const [running, setRunning] = useState<boolean>(false);
  const [errors, setErrors] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="destructive"
        className="h-fit w-fit text-9xl p-10"
        onClick={() => {
          setRunning(true);
          restartDockerCompose()
            .then((result) => {
              const errors = result.details.error;
              if (errors && !result.success) {
                setErrors(errors.toString());
              } else {
                setSuccess(true);
              }
            })
            .finally(() => setRunning(false));
        }}
      >
        DO IT
        {running && (
          <LoaderCircle
            className="animate-spin-slow mr-6"
            style={{
              width: '1em',
              height: '1em',
            }}
          />
        )}
      </Button>
      {errors && (
        <EasyAlert variant="destructive" title="Error!" description={errors} />
      )}
      {success && (
        <EasyAlert title="Success!" description="Qbit should now be working" />
      )}
    </div>
  );
}
