import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widget-task-handler';

// Must be imported before App so TaskManager.defineTask() is called at launch.
// This ensures prayer notifications are rescheduled after a device reboot.
import './src/utils/backgroundNotificationTask';

import App from './App';


// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

registerWidgetTaskHandler(widgetTaskHandler);
