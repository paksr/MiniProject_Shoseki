import { registerRootComponent } from 'expo';

if (!global.structuredClone) {
    global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

import App from './App';

registerRootComponent(App);