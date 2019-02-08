// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
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
  configdb: 'https://stg-horizonapi.yamas.ouroath.com:4443/api/v1',
  configdb2: 'https://stg-horizonapi.yamas.ouroath.com:4443/api/v1',
  // metaApi: 'https://tsdbr-20-gq1.yamas.ouroath.com:4443/api'
  metaApi: 'https://meta.yamas.ouroath.com:443/api'
};
