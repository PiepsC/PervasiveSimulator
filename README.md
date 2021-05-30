# PervasiveSimulator
Masters project for the course Pervasive Systems

# Dependencies
I've intentionally kept the dependencies as small as possible as Electron on its own is already pretty bloated. No framework or CDN is being used. It only uses Electron-Forge for building purposes.

To run you must first download [Nodejs](https://nodejs.org/en/). I suggest downloading the LTS version. Make sure to check the installation is succesful by issueing:
```npm --version```

After having done that clone the repository and attempt to install the dependencies from the lock file by using:

``npm install``

After that finishes the app should be runnable using the script

```npm start```

If the above doesn't work just contact me real quick. Electron bundles the entire Chromium instance which might be downloaded correctly through the dependencies.
