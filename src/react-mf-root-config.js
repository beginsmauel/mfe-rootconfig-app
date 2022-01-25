import {
  constructRoutes,
  constructApplications,
  constructLayoutEngine,
} from "single-spa-layout";
import { registerApplication, start } from "single-spa";
import * as Keycloak from 'keycloak-js'


let initOptions = {
  "url": 'https://34.124.216.252:8443/auth/', 
  "realm": 'MFEpoc', 
  "clientId": 'mfe-poc-app', 
  "onLoad": 'login-required'
}

let keycloak = Keycloak(initOptions);
console.log("KC", Keycloak)
keycloak.init({ onLoad: initOptions.onLoad }).then((auth) => {
  if (!auth) {
      localStorage.setItem("loggedIn", "false");
      localStorage.setItem("username", "");
      window.location.reload();
  } else {
      console.info("Authenticated");
      if ((keycloak.token && keycloak.idToken) != '') {
         localStorage.setItem("loggedIn", "true");
	 localStorage.setItem("username", keycloak.tokenParsed.preferred_username);
      }
      else {
        localStorage.setItem("loggedIn", "false");
	localStorage.setItem("username", "");
        localStorage.setItem("react-token", "");
        localStorage.setItem("react-refresh-token", "");
      }

  }

  
  localStorage.setItem("react-token", keycloak.token);
  localStorage.setItem("react-refresh-token", keycloak.refreshToken);

  setTimeout(() => {
      keycloak.updateToken(70).then((refreshed) => {
          if (refreshed) {
              console.debug('Token refreshed' + refreshed);
          } else {
              console.warn('Token not refreshed, valid for '
                  + Math.round(keycloak.tokenParsed.exp + keycloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
          }
      }).catch(() => {
          console.error('Failed to refresh token');
      });


  }, 60000)

}).catch(() => {
  console.log("Authenticated Failed");
  localStorage.setItem("loggedIn", "false");
  localStorage.setItem("username", "");
  localStorage.setItem("react-token", "");
  localStorage.setItem("react-refresh-token", "");


});

setInterval(() => {
    if(localStorage.getItem("loggedIn") == "false"){;
      keycloak.logout().then((loggedOut) => {
          if (loggedOut) {
              localStorage.setItem("react-token", "");
              localStorage.setItem("react-refresh-token", "");
              localStorage.setItem("loggedIn", "false");
	      localStorage.setItem("username", "");
              console.debug("User is Logged out");
          } else {
              console.debug("User is not Logged out");
          }
      }).catch(() => {
          console.error('Failed to Logged out');
      });
	}
  }, 1000)



const routes = constructRoutes(document.querySelector("#single-spa-layout"), {
  loaders: {
    topNav: "<h1>Loading topnav</h1>",
  },
  errors: {
    topNav: "<h1>Failed to load topnav</h1>",
  },
});

const applications = constructApplications({
  routes,
  loadApp: ({ name }) => System.import(name),
});
// Delay starting the layout engine until the styleguide CSS is loaded
const layoutEngine = constructLayoutEngine({
  routes,
  applications,
  active: false,
});

applications.forEach(registerApplication);

System.import("@react-mf/styleguide") && System.import("@login/login").then(() => {
  // Activate the layout engine once the styleguide CSS is loaded
  layoutEngine.activate();
  start();
});
