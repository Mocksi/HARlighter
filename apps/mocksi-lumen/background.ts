import BackgroundSync from "./background/backgroundSync";
import ExtensionStorage from "./shared/ExtensionStorage";

const storage = new ExtensionStorage();
const backgroundSync = new BackgroundSync(storage);

backgroundSync.start();
