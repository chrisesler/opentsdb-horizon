export const environment = {
  production: true,
  tsdb_host: 'https://tsdbr-1-bf2.yamas.ouroath.com:4443',
  tsdb_hosts: [
    'https://metrics-a.yamas.ouroath.com:443',
    'https://metrics-b.yamas.ouroath.com:443',
    'https://metrics-c.yamas.ouroath.com:443',
    'https://metrics-d.yamas.ouroath.com:443',
    'https://metrics-e.yamas.ouroath.com:443',
    'https://metrics-f.yamas.ouroath.com:443',
    'https://metrics-g.yamas.ouroath.com:443',
  ],
  //configdb: 'https://stg-horizonapi.yamas.ouroath.com:4443/api/v1',
  // QA Server for testing
  configdb: 'https://qa-horizonapi.yamas.ouroath.com:4443/api/v1',
  metaApi: 'https://meta.yamas.ouroath.com:443/api'
};
