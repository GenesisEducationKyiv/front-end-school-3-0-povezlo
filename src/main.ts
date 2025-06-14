import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from '@app/app.config';
import { AppComponent } from '@app/app.component';
import { Result } from '@app/shared';

const startApp = async (): Promise<void> => {
  const result = await bootstrapApplication(AppComponent, appConfig).then(
    (app) => Result.Ok(app),
    (error: unknown) => Result.Error(error instanceof Error ? error : new Error(String(error)))
  );

  Result.match(
    result,
    () => {
      console.log('Application bootstrapped successfully');
    },
    (error: unknown) => {
      console.error('Application bootstrap failed:', error instanceof Error ? error.message : String(error));
      console.error('Error details:', error);
    }
  );
};

void startApp();
