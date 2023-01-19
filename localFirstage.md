# LocalFirstage

An offline-first database api that is compatible with the localForage API.

```
class LocalFirstage_LocalForage_ApiLocal extends LocalFirstage_ApiLocal {}
class LocalFirstage_Firestore_ApiRemote extends LocalFirstage_ApiRemote {}

const local = new LocalFirstage_LocalForage_ApiLocal("MyUniqueName");
const remote = new LocalFirstage_Firestore_ApiRemote("Notes");
const myLocalFirstage = new LocalFirstage(local, remote);

localForage.setItem("myKey", 17);
myLocalFirstage.setItem("myKey", 17);

await localForage.getItem("myKey");
await myLocalFirstage.getItem("myKey");

await localForage.keys();
await myLocalFirstage.keys();

etc.
```
