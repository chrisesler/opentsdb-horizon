# horizon
Horizon Yamas UI

## Contribution

1. Fork [Horizon](https://git.ouroath.com/monitoring/horizon)
2. Create a new branch my-new-feature
3. Make the desired changes and push the code changes to your repository
4. Create to PR to [Dev Branch](https://git.ouroath.com/monitoring/horizon/tree/dev)

## Installation Guide

### 1. Download Dependencies

#### Option 1: for VMs
```
  yinst install ynodejs_core -br current
  yinst install ynpm -br current
  sudo npm install -g yo generator-angular bower grunt
  npm install node-sass grunt-sass
```

#### Option 2: for Dev Machine
```
  Install Node from: http://nodejs.org/download/
```

### 2. Install YNPM Dependencies
```  
  cd horizon
  npm -g install ynpm --registry=https://ynpm-registry.corp.yahoo.com/ --cache $HOME/.ynpm
  ynpm i yby
  ynpm i express-okta-oath
```

### 3. Install Horizon
```  
  cd horizon
  npm install
```

### 4. Install Gulp and ChartJS dependencies
```
npm i -g gulp
cd frontend/src/app/shared/chartjs
npm i
gulp build
```

### 5. Install Certificates

#### Using backyard cookie, talk directly with OpenTSDB servers
Make a \*.yahoo.com domain reference in your /etc/hosts file:

```
  sudo bash -c 'echo "127.0.0.1 dev.yamas.ops.yahoo.com" >> /private/etc/hosts'
```

#### Generate self signed certificates (skip if you have done this for aura)
```
mkdir ~/.ssh/yamas
cd ~/.ssh/yamas
sudo ssh-keygen -f dev.yamas.key
sudo openssl req -new -key dev.yamas.key -out dev.yamas.csr

 Country Name (2 letter code) [AU]:US
 State or Province Name (full name) [Some-State]:CA
 Locality Name (eg, city) []:Sunnyvale
 Organization Name (eg, company) [Internet Widgits Pty Ltd]:Yahoo Inc
 Organizational Unit Name (eg, section) []:Scitech
 Common Name (e.g. server FQDN or YOUR name) []:dev.yamas.ops.yahoo.com
 Email Address []:yamas-devel@yahoo-inc.com

sudo openssl x509 -req -days 365 -in dev.yamas.csr -signkey dev.yamas.key -out dev.yamas.crt
sudo chown -R <userid>:staff ${HOME}/.ssh/yamas
```

### 6. Start application - this requires 2 terminals to be opened at the same time.
```
  #terminal 1:
  cd frontend
  npm start

  #terminal 2
  cd server
  npm start
```

#### 7. Load horizon:

```
  https://dev.yamas.ops.yahoo.com:4443/
```

Note: In Chrome, you may have to type `thisisunsafe` to bypass HSTS security warning.