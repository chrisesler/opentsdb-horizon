// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  // tsdb_host: 'https://tsdbr-1-bf2.yamas.ouroath.com:4443',
  tsdb_host: 'https://tsdbr-1-bf2.yamas.ouroath.com:4443',
  tsdb_hosts: [
    'metrics-a.yamas.ouroath.com:4443',
    'metrics-b.yamas.ouroath.com:4443',
    'metrics-c.yamas.ouroath.com:4443',
    'metrics-d.yamas.ouroath.com:4443',
    'metrics-e.yamas.ouroath.com:4443',
    'metrics-f.yamas.ouroath.com:4443',
    'metrics-g.yamas.ouroath.com:4443',
  ],
  // configdb: 'http://stg-horizon-service-1.yms.gq1.yahoo.com:4080/api/v1'
  configdb: 'https://stg-horizonapi.yamas.ouroath.com:4443/api/v1',
  configdb2: 'https://stg-horizonapi.yamas.ouroath.com:4443/api/v1'
};
