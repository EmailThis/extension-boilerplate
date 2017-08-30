import storage from './storage';

export default class Auth {
  constructor() {
    this.token           = null;
    this.refreshToken    = null;
    this.expirationDate  = null;
    this.isAuthenticated = false;
    this.secret          = null;

    storage.get('troovySecret', resp => {
      this.secret = resp.troovySecret;
    });
  }

  checkToken() {
    return new Promise((resolve, reject) => {

      if (!this.token) {
        storage.get('troovyExtension', resp => {
          let data = resp.troovyExtension;

          if (data) {
            this.expirationDate = data.expiration;
            this.token          = data.token;
            this.refreshToken   = data.refreshToken;
            console.log('Token found: ' + data.token);

            if (this.hasExpired()) {
              console.log(`Token expired on: ${new Date(this.expirationDate)}`);
              console.log('Retrying for a new token...');

              this.updateToken().then((values) => {
                console.log('Refreshed!');

                this.expirationDate  = values.expiration;
                this.token           = values.token;
                this.refreshToken    = values.refreshToken;
                this.isAuthenticated = true;

                return resolve();
              }, () => {
                return reject();
              });

            } else {
              this.isAuthenticated = true;
              return resolve();
            }

          } else {
            console.log('No token found.');
            return reject();
          }

        });
      }
    });
  }

  hasExpired() {
    let currentDate    = new Date();
    let expirationDate = new Date(this.expirationDate);

    return (currentDate >= expirationDate);
  }

  getToken(username, password, callback) {
    console.log('Getting new token...');
    let xmlhttp = new XMLHttpRequest();

    xmlhttp.open('POST', 'https://app.troovy-stage.com/oauth/token', true);
    xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    let params = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&grant_type=password&client_id=2&client_secret=${this.secret}&scope=*`;

    xmlhttp.onload = () => {
      if (xmlhttp.status === 200) {
        let response = xmlhttp.responseText;

        let t              = JSON.parse(response);
        let expirationDate = new Date(new Date().getTime() + (t.expires_in * 1000));

        let values = {
          token       : t.access_token,
          refreshToken: t.refresh_token,
          expiration  : expirationDate.getTime()
        };

        // Store our access token in local storage
        storage.set({
          'troovyExtension': values
        }, () => {
          console.log(`The value stored was: ${JSON.stringify(values)}`);
        });

        this.isAuthenticated = true;

        return callback();
      }
      else {
        this.isAuthenticated = false;

        document.getElementById('progress-icon').innerHTML = '<img height=\'50px\' width=\'50px\' src=\'failed.png\'>';
        document.getElementById('progress-text').innerHTML = 'Authentication failed!!';
      }
    };

    xmlhttp.send(params);
  }

  updateToken() {
    return new Promise((resolve, reject) => {

      console.log('Refreshing token...');

      let params = `refresh_token=${encodeURIComponent(this.refreshToken)}&client_id=2&grant_type=refresh_token&client_secret=${encodeURIComponent(this.secret)}`;

      let xmlhttp = new XMLHttpRequest();

      xmlhttp.open('POST', 'https://app.troovy-stage.com/oauth/token', true);
      xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

      xmlhttp.onload = () => {
        if (xmlhttp.status === 200) {
          console.log('Refresh call ended');
          let response = xmlhttp.responseText;

          let t              = JSON.parse(response);
          let expirationDate = new Date(new Date().getTime() + (t.expires_in * 1000));

          let values = {
            token       : t.access_token,
            refreshToken: t.refresh_token,
            expiration  : expirationDate.getTime()
          };

          // Store our access token in local storage
          storage.set({
            'troovyExtension': values
          }, () => {
            console.log(`The value stored was: ${values}`);
          });

          return resolve(values);
        }

        console.log('About to reject refresh function');
        return reject();
      };

      xmlhttp.send(params);
    });
  }
}