// import { initializeEventHooks } from './event-hook';
import type { HookController } from './function-hook';
// import { initializeXHRHook } from './request';

export interface MergedHookController extends HookController {
  reenable(): () => void;
}

export const mergeHookControllers = <T extends HookController[]>(
  ...controllers: T
): MergedHookController => {
  const mergedController: HookController = {
    enable: () => controllers.forEach((controller) => controller.enable()),
    disable: () => controllers.forEach((controller) => controller.disable()),
    isActive: () => controllers.every((controller) => controller.isActive()),
    remove: () => controllers.forEach((controller) => controller.remove()),
  };

  return {
    ...mergedController,
    reenable: () => {
      mergedController.enable();
      return () => mergedController.disable();
    },
  };
};

// export const setupAllBaseHooks = () => {
//   initializeEventHooks();
//   initializeXHRHook();
// };
