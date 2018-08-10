        // Data (Binary) - kbytes
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(0.1234 * Math.pow(10, i), 'kbytes', 2));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(0.1234 * Math.pow(10, i), 'kbytes', 2 );
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // Data (Decimal) - decbytes
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(0.1234 * Math.pow(10, i), 'decbytes', 3));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(0.1234 * Math.pow(10, i), 'decbytes');
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // Data Rate - MBs
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(0.1234 * Math.pow(10, i), 'MBs', 2));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(0.1234 * Math.pow(10, i), 'MBs', 2);
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // Throughput
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(0.1234 * Math.pow(10, i * i), 'rps', 20));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(0.1234 * Math.pow(10, i * i), 'rps', 20 );
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // TIME
        // console.log('Grafana:');
        // for (let i = 0; i < 20; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(1.234 * Math.pow(10, i), 'ms', 4));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 20; i++) {
        //     // let bigNum = this.UN.getBigNumber(1.234 * Math.pow(10, i), 'ms', 4);
        //     let bigNum = this.UN.getBigNumber(1.234 * Math.pow(10, i), 'ms', 4 );
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // SHORT
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(-1.234 * Math.pow(10, i), 'short', 2));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(-1.234 * Math.pow(10, i), 'short', 2 );
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // USD
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(1.234 * Math.pow(10, i), 'currencyUSD', 2));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(1.234 * Math.pow(10, i), 'usd', 2 );
        //     console.log(' ' + bigNum.unit + bigNum.num);
        // }

        // Unrecognized unit defaults to 'short' + unit
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(0.1234 * Math.pow(10, i), 'xyz', 2));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(0.1234 * Math.pow(10, i), 'xyz', 2 );
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }