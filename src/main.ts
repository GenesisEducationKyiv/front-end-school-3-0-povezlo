import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from '@app/app.config';
import { AppComponent } from '@app/app.component';
import { safeExecuteAsync } from '@app/shared';

const bootstrapApp = safeExecuteAsync(async () => {
  return await bootstrapApplication(AppComponent, appConfig);
});

const startApp = async (): Promise<void> => {
  const result = await bootstrapApp();

  if (result.isErr()) {
    console.error('Application bootstrap failed:', result.error.message);
    console.error('Error details:', result.error);
  } else {
    console.log('Application bootstrapped successfully');
  }
};

void startApp();
