var kbn: any = {};

kbn.valueFormats = {};

///// HELPER FUNCTIONS /////
kbn.toFixed = function(value, decimals) {
  if (value === null) {
    return '';
  }

  var factor = decimals ? Math.pow(10, Math.max(0, decimals)) : 1;
  var formatted = String(Math.round(value * factor) / factor);

  // if exponent return directly
  if (formatted.indexOf('e') !== -1 || value === 0) {
    return formatted;
  }

  // If tickDecimals was specified, ensure that we have exactly that
  // much precision; otherwise default to the value's own precision.
  if (decimals != null) {
    var decimalPos = formatted.indexOf('.');
    var precision = decimalPos === -1 ? 0 : formatted.length - decimalPos - 1;
    if (precision < decimals) {
      return (precision ? formatted : formatted + '.') + String(factor).substr(1, decimals - precision);
    }
  }

  return formatted;
};

kbn.toFixedScaled = function(value, decimals, scaledDecimals, additionalDecimals, ext) {
  if (scaledDecimals === null) {
    return kbn.toFixed(value, decimals) + ext;
  } else {
    return kbn.toFixed(value, scaledDecimals + additionalDecimals) + ext;
  }
};

///// FORMAT FUNCTION CONSTRUCTORS /////

kbn.formatBuilders = {};

// Formatter which always appends a fixed unit string to the value. No
// scaling of the value is performed.
kbn.formatBuilders.fixedUnit = function(unit) {
  return function(size, decimals) {
    if (size === null) {
      return '';
    }
    return kbn.toFixed(size, decimals) + ' ' + unit;
  };
};

// Formatter which scales the unit string geometrically according to the given
// numeric factor. Repeatedly scales the value down by the factor until it is
// less than the factor in magnitude, or the end of the array is reached.
kbn.formatBuilders.scaledUnits = function(factor, extArray) {
  return function(size, decimals, scaledDecimals) {
    if (size === null) {
      return '';
    }

    var steps = 0;
    var limit = extArray.length;

    while (Math.abs(size) >= factor) {
      steps++;
      size /= factor;

      if (steps >= limit) {
        return 'NA';
      }
    }

    if (steps > 0 && scaledDecimals !== null) {
      decimals = scaledDecimals + 3 * steps;
    }

    return kbn.toFixed(size, decimals) + extArray[steps];
  };
};

// Extension of the scaledUnits builder which uses SI decimal prefixes. If an
// offset is given, it adjusts the starting units at the given prefix; a value
// of 0 starts at no scale; -3 drops to nano, +2 starts at mega, etc.
kbn.formatBuilders.decimalSIPrefix = function(unit, offset) {
  var prefixes = ['n', 'µ', 'm', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  prefixes = prefixes.slice(3 + (offset || 0));
  var units = prefixes.map(function(p) {
    return ' ' + p + unit;
  });
  return kbn.formatBuilders.scaledUnits(1000, units);
};

// Extension of the scaledUnits builder which uses SI binary prefixes. If
// offset is given, it starts the units at the given prefix; otherwise, the
// offset defaults to zero and the initial unit is not prefixed.
kbn.formatBuilders.binarySIPrefix = function(unit, offset) {
  var prefixes = ['', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi'].slice(offset);
  var units = prefixes.map(function(p) {
    return ' ' + p + unit;
  });
  return kbn.formatBuilders.scaledUnits(1024, units);
};

// Currency formatter for prefixing a symbol onto a number. Supports scaling
// up to the trillions.
kbn.formatBuilders.currency = function(symbol) {
  var units = ['', 'K', 'M', 'B', 'T'];
  var scaler = kbn.formatBuilders.scaledUnits(1000, units);
  return function(size, decimals, scaledDecimals) {
    if (size === null) {
      return '';
    }
    var scaled = scaler(size, decimals, scaledDecimals);
    return symbol + scaled;
  };
};

kbn.formatBuilders.simpleCountUnit = function(symbol) {
  var units = ['', 'K', 'M', 'B', 'T'];
  var scaler = kbn.formatBuilders.scaledUnits(1000, units);
  return function(size, decimals, scaledDecimals) {
    if (size === null) {
      return '';
    }
    var scaled = scaler(size, decimals, scaledDecimals);
    return scaled + ' ' + symbol;
  };
};


// Dimensionless Units
kbn.valueFormats.none = kbn.toFixed;
kbn.valueFormats.short = kbn.formatBuilders.scaledUnits(1000, [
  '',
  ' K',
  ' Mil',
  ' Bil',
  ' Tri',
  ' Quadr',
  ' Quint',
  ' Sext',
  ' Sept',
]);

kbn.valueFormats.percent = function(size, decimals) {
  if (size === null) {
    return '';
  }
  return kbn.toFixed(size, decimals) + '%';
};

kbn.valueFormats.percentunit = function(size, decimals) {
  if (size === null) {
    return '';
  }
  return kbn.toFixed(100 * size, decimals) + '%';
};

// Currencies
kbn.valueFormats.currencyUSD = kbn.formatBuilders.currency('$');

// Data (Binary)
kbn.valueFormats.bits = kbn.formatBuilders.binarySIPrefix('b');
kbn.valueFormats.bytes = kbn.formatBuilders.binarySIPrefix('B');
kbn.valueFormats.kbytes = kbn.formatBuilders.binarySIPrefix('B', 1);
kbn.valueFormats.mbytes = kbn.formatBuilders.binarySIPrefix('B', 2);
kbn.valueFormats.gbytes = kbn.formatBuilders.binarySIPrefix('B', 3);

// Data (Decimal)
kbn.valueFormats.decbits = kbn.formatBuilders.decimalSIPrefix('b');
kbn.valueFormats.decbytes = kbn.formatBuilders.decimalSIPrefix('B');
kbn.valueFormats.deckbytes = kbn.formatBuilders.decimalSIPrefix('B', 1);
kbn.valueFormats.decmbytes = kbn.formatBuilders.decimalSIPrefix('B', 2);
kbn.valueFormats.decgbytes = kbn.formatBuilders.decimalSIPrefix('B', 3);

// Data Rate
kbn.valueFormats.pps = kbn.formatBuilders.decimalSIPrefix('pps');
kbn.valueFormats.bps = kbn.formatBuilders.decimalSIPrefix('bps');
kbn.valueFormats.Bps = kbn.formatBuilders.decimalSIPrefix('B/s');
kbn.valueFormats.KBs = kbn.formatBuilders.decimalSIPrefix('Bs', 1);
kbn.valueFormats.Kbits = kbn.formatBuilders.decimalSIPrefix('bps', 1);
kbn.valueFormats.MBs = kbn.formatBuilders.decimalSIPrefix('Bs', 2);
kbn.valueFormats.Mbits = kbn.formatBuilders.decimalSIPrefix('bps', 2);
kbn.valueFormats.GBs = kbn.formatBuilders.decimalSIPrefix('Bs', 3);
kbn.valueFormats.Gbits = kbn.formatBuilders.decimalSIPrefix('bps', 3);

// Hash Rate
kbn.valueFormats.Hs = kbn.formatBuilders.decimalSIPrefix('H/s');
kbn.valueFormats.KHs = kbn.formatBuilders.decimalSIPrefix('H/s', 1);
kbn.valueFormats.MHs = kbn.formatBuilders.decimalSIPrefix('H/s', 2);
kbn.valueFormats.GHs = kbn.formatBuilders.decimalSIPrefix('H/s', 3);
kbn.valueFormats.THs = kbn.formatBuilders.decimalSIPrefix('H/s', 4);
kbn.valueFormats.PHs = kbn.formatBuilders.decimalSIPrefix('H/s', 5);
kbn.valueFormats.EHs = kbn.formatBuilders.decimalSIPrefix('H/s', 6);

// Throughput
kbn.valueFormats.ops = kbn.formatBuilders.simpleCountUnit('ops');
kbn.valueFormats.reqps = kbn.formatBuilders.simpleCountUnit('reqps');
kbn.valueFormats.rps = kbn.formatBuilders.simpleCountUnit('rps');
kbn.valueFormats.wps = kbn.formatBuilders.simpleCountUnit('wps');
kbn.valueFormats.iops = kbn.formatBuilders.simpleCountUnit('iops');
kbn.valueFormats.opm = kbn.formatBuilders.simpleCountUnit('opm');
kbn.valueFormats.rpm = kbn.formatBuilders.simpleCountUnit('rpm');
kbn.valueFormats.wpm = kbn.formatBuilders.simpleCountUnit('wpm');

// Time
kbn.valueFormats.hertz = kbn.formatBuilders.decimalSIPrefix('Hz');

kbn.valueFormats.ms = function(size, decimals, scaledDecimals) {
  if (size === null) {
    return '';
  }

  if (Math.abs(size) < 1000) {
    return kbn.toFixed(size, decimals) + ' ms';
  } else if (Math.abs(size) < 60000) {
    // Less than 1 min
    return kbn.toFixedScaled(size / 1000, decimals, scaledDecimals, 3, ' s');
  } else if (Math.abs(size) < 3600000) {
    // Less than 1 hour, divide in minutes
    return kbn.toFixedScaled(size / 60000, decimals, scaledDecimals, 5, ' min');
  } else if (Math.abs(size) < 86400000) {
    // Less than one day, divide in hours
    return kbn.toFixedScaled(size / 3600000, decimals, scaledDecimals, 7, ' hour');
  } else if (Math.abs(size) < 31536000000) {
    // Less than one year, divide in days
    return kbn.toFixedScaled(size / 86400000, decimals, scaledDecimals, 8, ' day');
  }

  return kbn.toFixedScaled(size / 31536000000, decimals, scaledDecimals, 10, ' year');
};

kbn.valueFormats.s = function(size, decimals, scaledDecimals) {
  if (size === null) {
    return '';
  }

  // Less than 1 µs, divide in ns
  if (Math.abs(size) < 0.000001) {
    return kbn.toFixedScaled(size * 1e9, decimals, scaledDecimals - decimals, -9, ' ns');
  }
  // Less than 1 ms, divide in µs
  if (Math.abs(size) < 0.001) {
    return kbn.toFixedScaled(size * 1e6, decimals, scaledDecimals - decimals, -6, ' µs');
  }
  // Less than 1 second, divide in ms
  if (Math.abs(size) < 1) {
    return kbn.toFixedScaled(size * 1e3, decimals, scaledDecimals - decimals, -3, ' ms');
  }

  if (Math.abs(size) < 60) {
    return kbn.toFixed(size, decimals) + ' s';
  } else if (Math.abs(size) < 3600) {
    // Less than 1 hour, divide in minutes
    return kbn.toFixedScaled(size / 60, decimals, scaledDecimals, 1, ' min');
  } else if (Math.abs(size) < 86400) {
    // Less than one day, divide in hours
    return kbn.toFixedScaled(size / 3600, decimals, scaledDecimals, 4, ' hour');
  } else if (Math.abs(size) < 604800) {
    // Less than one week, divide in days
    return kbn.toFixedScaled(size / 86400, decimals, scaledDecimals, 5, ' day');
  } else if (Math.abs(size) < 31536000) {
    // Less than one year, divide in week
    return kbn.toFixedScaled(size / 604800, decimals, scaledDecimals, 6, ' week');
  }

  return kbn.toFixedScaled(size / 3.15569e7, decimals, scaledDecimals, 7, ' year');
};

kbn.valueFormats['µs'] = function(size, decimals, scaledDecimals) {
  if (size === null) {
    return '';
  }

  if (Math.abs(size) < 1000) {
    return kbn.toFixed(size, decimals) + ' µs';
  } else if (Math.abs(size) < 1000000) {
    return kbn.toFixedScaled(size / 1000, decimals, scaledDecimals, 3, ' ms');
  } else {
    return kbn.toFixedScaled(size / 1000000, decimals, scaledDecimals, 6, ' s');
  }
};

kbn.valueFormats.ns = function(size, decimals, scaledDecimals) {
  if (size === null) {
    return '';
  }

  if (Math.abs(size) < 1000) {
    return kbn.toFixed(size, decimals) + ' ns';
  } else if (Math.abs(size) < 1000000) {
    return kbn.toFixedScaled(size / 1000, decimals, scaledDecimals, 3, ' µs');
  } else if (Math.abs(size) < 1000000000) {
    return kbn.toFixedScaled(size / 1000000, decimals, scaledDecimals, 6, ' ms');
  } else if (Math.abs(size) < 60000000000) {
    return kbn.toFixedScaled(size / 1000000000, decimals, scaledDecimals, 9, ' s');
  } else {
    return kbn.toFixedScaled(size / 60000000000, decimals, scaledDecimals, 12, ' min');
  }
};

kbn.valueFormats.m = function(size, decimals, scaledDecimals) {
  if (size === null) {
    return '';
  }

  if (Math.abs(size) < 60) {
    return kbn.toFixed(size, decimals) + ' min';
  } else if (Math.abs(size) < 1440) {
    return kbn.toFixedScaled(size / 60, decimals, scaledDecimals, 2, ' hour');
  } else if (Math.abs(size) < 10080) {
    return kbn.toFixedScaled(size / 1440, decimals, scaledDecimals, 3, ' day');
  } else if (Math.abs(size) < 604800) {
    return kbn.toFixedScaled(size / 10080, decimals, scaledDecimals, 4, ' week');
  } else {
    return kbn.toFixedScaled(size / 5.25948e5, decimals, scaledDecimals, 5, ' year');
  }
};

kbn.valueFormats.h = function(size, decimals, scaledDecimals) {
  if (size === null) {
    return '';
  }

  if (Math.abs(size) < 24) {
    return kbn.toFixed(size, decimals) + ' hour';
  } else if (Math.abs(size) < 168) {
    return kbn.toFixedScaled(size / 24, decimals, scaledDecimals, 2, ' day');
  } else if (Math.abs(size) < 8760) {
    return kbn.toFixedScaled(size / 168, decimals, scaledDecimals, 3, ' week');
  } else {
    return kbn.toFixedScaled(size / 8760, decimals, scaledDecimals, 4, ' year');
  }
};

kbn.valueFormats.d = function(size, decimals, scaledDecimals) {
  if (size === null) {
    return '';
  }

  if (Math.abs(size) < 7) {
    return kbn.toFixed(size, decimals) + ' day';
  } else if (Math.abs(size) < 365) {
    return kbn.toFixedScaled(size / 7, decimals, scaledDecimals, 2, ' week');
  } else {
    return kbn.toFixedScaled(size / 365, decimals, scaledDecimals, 3, ' year');
  }
};

export default kbn;
