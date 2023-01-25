# LocalFirstage

### An offline-first database with an API that is compatible with the localForage API.

Useful for working offline. It is also useful if you often want to do a full text search of your database.

Only once, create a local class for each type of database,  and a remote class for each type of database. Import these classes into your code.
```
class LocalFirstage_LocalForage_ApiLocal extends LocalFirstage_ApiLocal {}
class LocalFirstage_Firestore_ApiRemote extends LocalFirstage_ApiRemote {}
```

In your code, initialize the localFirstage database.
```
const local = new LocalFirstage_LocalForage_ApiLocal("MyUniqueName");
const remote = new LocalFirstage_Firestore_ApiRemote("MyUniqueName2");
const myLocalFirstage = new LocalFirstage(local, remote);
```

Use the database the same as you use localForage
```
localForage.setItem("myKey", 17);
myLocalFirstage.setItem("myKey", 17);

await localForage.getItem("myKey");
await myLocalFirstage.getItem("myKey");

await localForage.keys();
await myLocalFirstage.keys();

etc.
```
