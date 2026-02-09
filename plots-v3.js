/******/ var __webpack_modules__ = ({

/***/ "./src/webviews/plots/data-transformers/data-transformer-csv.ts":
/*!**********************************************************************!*\
  !*** ./src/webviews/plots/data-transformers/data-transformer-csv.ts ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.CsvDataTransformer = void 0;
const Bokeh = __webpack_require__(/*! @bokeh/bokehjs */ "@bokeh/bokehjs");
const data_transformer_1 = __webpack_require__(/*! ./data-transformer */ "./src/webviews/plots/data-transformers/data-transformer.ts");
const plots_1 = __webpack_require__(/*! ../plots */ "./src/webviews/plots/plots/index.ts");
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
const defaultTimeParamName = "time";
// MARK: data transformer class
class CsvDataTransformer extends data_transformer_1.DataTransformer {
  constructor(props) {
    super();
    this._params = props.parameters;
    this._cache = new Map();
    this._emptyCds = new Bokeh.ColumnDataSource({
      data: {
        x: [],
        y: [],
        t: []
      }
    });
    this._ifParamNotFound = props.ifParamNotFound ?? plots_1.defaultIfParamNotFound;
    // check time parameter exists
    const timeParamName = props.timeParamName ?? defaultTimeParamName;
    const paramTime = this._params.find(p => p.name === timeParamName);
    if (paramTime == undefined) {
      throw new Error(`Parameter "${timeParamName}" not found`);
    }
    this._paramTime = paramTime;
    // check rectangular
    const n = this._paramTime.values.length;
    for (const p of this._params) {
      if (p.values.length !== n) {
        throw new Error(`The data is not rectangular: ${n} elements in ${timeParamName} and ${p.values.length} elements in ${p.name}`);
      }
    }
  }
  toColumnDataSourceNormal(name, ifParamNotFound) {
    const key = `normal/${name}`;
    const cachedCds = this._cache.get(key);
    if (cachedCds != undefined) {
      return cachedCds;
    }
    const param = this._params.find(p => p.name === name);
    if (param == undefined) {
      return this.handleParameterNotFound(name, ifParamNotFound);
    }
    const data = {
      x: this._paramTime.values,
      y: param.values
    };
    const cds = new Bokeh.ColumnDataSource({
      data
    });
    this._cache.set(key, cds);
    return cds;
  }
  toColumnDataSourceBoolean(name, index, ifParamNotFound) {
    const key = `booleans/${name}/${index}`;
    const cachedCds = this._cache.get(key);
    if (cachedCds != undefined) {
      return cachedCds;
    }
    const param = this._params.find(p => p.name === name);
    if (param == undefined) {
      return this.handleParameterNotFound(name, ifParamNotFound);
    }
    const data = {
      x: this._paramTime.values,
      y: param.values.map(y => isNaN(y) ? NaN : y > 0.5 ? 1 : 0).map(y => 0.7 * y - index)
    };
    const cds = new Bokeh.ColumnDataSource({
      data
    });
    this._cache.set(key, cds);
    return cds;
  }
  toColumnDataSourceMap(nameLat, nameLon, refSamples, interpolation, ifParamNotFound) {
    const key = `map/${nameLat}/${nameLon}`;
    const cachedCds = this._cache.get(key);
    if (cachedCds != undefined) {
      return cachedCds;
    }
    const paramLat = this._params.find(p => p.name === nameLat);
    const paramLon = this._params.find(p => p.name === nameLon);
    if (paramLat == undefined) {
      return this.handleParameterNotFound(nameLat, ifParamNotFound);
    }
    if (paramLon == undefined) {
      return this.handleParameterNotFound(nameLon, ifParamNotFound);
    }
    const data = {
      t: this._paramTime.values,
      x: paramLon.values.map(utils_1.mercator.lonToX),
      y: paramLat.values.map(utils_1.mercator.latToY)
    };
    const cds = new Bokeh.ColumnDataSource({
      data
    });
    this._cache.set(key, cds);
    return cds;
  }
  getPreviousYValueAt(name, t) {
    const regex = new RegExp("^((normal/" + name + ")|(booleans/" + name + "/\\d+))$");
    const matchingKeys = [...this._cache.keys()].filter(key => regex.test(key));
    if (matchingKeys.length === 0) {
      return null;
    }
    const key = matchingKeys[0];
    const isNormal = key.startsWith("normal/");
    const cds = this._cache.get(key);
    if (cds == undefined) {
      return null;
    }
    // @ts-ignore
    const xvalues = cds.data["x"];
    // @ts-ignore
    const yvalues = cds.data["y"];
    const index = (0, utils_1.getPreviousByDichotomy)(xvalues, t);
    if (index == null) {
      return null;
    }
    const y = yvalues[index];
    if (y == undefined) {
      return null;
    }
    return isNormal ? y : Math.abs(y % 1) > 0.1 ? 1 : 0;
  }
  getYRange(name, x1, x2) {
    const regex = new RegExp("^normal/" + name + "$");
    const matchingKeys = [...this._cache.keys()].filter(key => regex.test(key));
    if (matchingKeys.length === 0) {
      return null;
    }
    const key = matchingKeys[0];
    const cds = this._cache.get(key);
    if (cds == undefined) {
      return null;
    }
    // @ts-ignore
    const xvalues = cds.data["x"];
    // @ts-ignore
    const yvalues = cds.data["y"];
    if (xvalues.length === 1) {
      return (0, utils_1.isValueOk)(yvalues[0]) ? {
        start: yvalues[0] - 0.5,
        end: yvalues[0] + 0.5
      } : null;
    }
    if (xvalues.length === 2) {
      return (0, utils_1.isValueOk)(yvalues[0]) && (0, utils_1.isValueOk)(yvalues[1]) ? {
        start: Math.min(yvalues[0], yvalues[1]),
        end: Math.max(yvalues[0], yvalues[1])
      } : null;
    }
    const n = xvalues.length;
    const i1 = (0, utils_1.lim)((0, utils_1.getPreviousByDichotomy)(xvalues, x1) ?? 0, 0, n - 1);
    const i2 = (0, utils_1.lim)((0, utils_1.getNextByDichotomy)(xvalues, x2) ?? n - 1, 0, n - 1);
    const temp = (0, utils_1.minmax)(yvalues.slice(i1, i2 + 1));
    if (!(0, utils_1.isValueOk)(temp.min) || !(0, utils_1.isValueOk)(temp.max)) {
      return null;
    }
    return {
      start: temp.min,
      end: temp.max
    };
  }
  handleParameterNotFound(paramName, ifParamNotFound) {
    const action = ifParamNotFound ?? this._ifParamNotFound;
    return action === "show-in-legend" ? this._emptyCds : null;
  }
}
exports.CsvDataTransformer = CsvDataTransformer;

/***/ }),

/***/ "./src/webviews/plots/data-transformers/data-transformer-fdoat.ts":
/*!************************************************************************!*\
  !*** ./src/webviews/plots/data-transformers/data-transformer-fdoat.ts ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.FdoatDataTransformer = void 0;
const Bokeh = __webpack_require__(/*! @bokeh/bokehjs */ "@bokeh/bokehjs");
const data_transformer_1 = __webpack_require__(/*! ./data-transformer */ "./src/webviews/plots/data-transformers/data-transformer.ts");
const plots_1 = __webpack_require__(/*! ../plots */ "./src/webviews/plots/plots/index.ts");
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
// MARK: data transformer class
class FdoatDataTransformer extends data_transformer_1.DataTransformer {
  constructor(props) {
    super();
    this._data = props.data;
    this._cache = new Map();
    this._emptyCds = new Bokeh.ColumnDataSource({
      data: {
        x: [],
        y: [],
        t: []
      }
    });
    this._ifParamNotFound = props.ifParamNotFound ?? plots_1.defaultIfParamNotFound;
  }
  toColumnDataSourceNormal(name, ifParamNotFound) {
    const key = `normal/${name}`;
    const cachedCds = this._cache.get(key);
    if (cachedCds != undefined) {
      return cachedCds;
    }
    const param = this._data.parameters.find(p => p.name === name);
    if (param == undefined) {
      return this.handleParameterNotFound(name, ifParamNotFound);
    }
    const data = {
      x: paramToTimes(param, this._data.start),
      y: param.values.map(y => y == null ? NaN : y)
    };
    const cds = new Bokeh.ColumnDataSource({
      data
    });
    this._cache.set(key, cds);
    return cds;
  }
  toColumnDataSourceBoolean(name, index, ifParamNotFound) {
    const key = `booleans/${name}/${index}`;
    const cachedCds = this._cache.get(key);
    if (cachedCds != undefined) {
      return cachedCds;
    }
    const param = this._data.parameters.find(p => p.name === name);
    if (param == undefined) {
      return this.handleParameterNotFound(name, ifParamNotFound);
    }
    const data = {
      x: paramToTimes(param, this._data.start),
      y: param.values.map(y => y == null || isNaN(y) ? NaN : y > 0.5 ? 1 : 0).map(y => 0.7 * y - index)
    };
    const cds = new Bokeh.ColumnDataSource({
      data
    });
    this._cache.set(key, cds);
    return cds;
  }
  toColumnDataSourceMap(nameLat, nameLon, refSamples, interpolation, ifParamNotFound) {
    const key = `map/${nameLat}/${nameLon}`;
    const cachedCds = this._cache.get(key);
    if (cachedCds != undefined) {
      return cachedCds;
    }
    const paramLat = this._data.parameters.find(p => p.name === nameLat);
    const paramLon = this._data.parameters.find(p => p.name === nameLon);
    if (paramLat == undefined) {
      return this.handleParameterNotFound(nameLat, ifParamNotFound);
    }
    if (paramLon == undefined) {
      return this.handleParameterNotFound(nameLon, ifParamNotFound);
    }
    const replaceNull = x => x == null ? NaN : x;
    const reference = refSamples === "auto" ? selectReference(paramLat, paramLon) : refSamples;
    const timeValues = paramToTimes(reference === "lat" ? paramLat : paramLon, this._data.start);
    const lonValues = reference === "lon" ? paramLon.values.map(replaceNull) : reinterpolateParameter(paramLon, paramLat, interpolation);
    const latValues = reference === "lat" ? paramLat.values.map(replaceNull) : reinterpolateParameter(paramLat, paramLon, interpolation);
    const data = {
      t: timeValues,
      x: lonValues.map(utils_1.mercator.lonToX),
      y: latValues.map(utils_1.mercator.latToY)
    };
    const cds = new Bokeh.ColumnDataSource({
      data
    });
    this._cache.set(key, cds);
    return cds;
  }
  getPreviousYValueAt(name, t) {
    const regex = new RegExp("^((normal/" + name + ")|(booleans/" + name + "/\\d+))$");
    const matchingKeys = [...this._cache.keys()].filter(key => regex.test(key));
    if (matchingKeys.length === 0) {
      return null;
    }
    const key = matchingKeys[0];
    const isNormal = key.startsWith("normal/");
    const cds = this._cache.get(key);
    if (cds == undefined) {
      return null;
    }
    // @ts-ignore
    const xvalues = cds.data["x"];
    // @ts-ignore
    const yvalues = cds.data["y"];
    const index = (0, utils_1.getPreviousAssumingEquallySpaced)(xvalues, t);
    if (index == null) {
      return null;
    }
    const y = yvalues[index];
    if (y == undefined) {
      return null;
    }
    return isNormal ? y : Math.abs(y % 1) > 0.1 ? 1 : 0;
  }
  getYRange(name, x1, x2) {
    const regex = new RegExp("^normal/" + name + "$");
    const matchingKeys = [...this._cache.keys()].filter(key => regex.test(key));
    if (matchingKeys.length === 0) {
      return null;
    }
    const key = matchingKeys[0];
    const cds = this._cache.get(key);
    if (cds == undefined) {
      return null;
    }
    // @ts-ignore
    const xvalues = cds.data["x"];
    // @ts-ignore
    const yvalues = cds.data["y"];
    if (xvalues.length === 1) {
      return (0, utils_1.isValueOk)(yvalues[0]) ? {
        start: yvalues[0] - 0.5,
        end: yvalues[0] + 0.5
      } : null;
    }
    if (xvalues.length === 2) {
      return (0, utils_1.isValueOk)(yvalues[0]) && (0, utils_1.isValueOk)(yvalues[1]) ? {
        start: Math.min(yvalues[0], yvalues[1]),
        end: Math.max(yvalues[0], yvalues[1])
      } : null;
    }
    const n = xvalues.length;
    const i1 = (0, utils_1.lim)((0, utils_1.getPreviousAssumingEquallySpaced)(xvalues, x1) ?? 0, 0, n - 1);
    const i2 = (0, utils_1.lim)((0, utils_1.getNextAssumingEquallySpaced)(xvalues, x2) ?? n - 1, 0, n - 1);
    const temp = (0, utils_1.minmax)(yvalues.slice(i1, i2 + 1));
    if (!(0, utils_1.isValueOk)(temp.min) || !(0, utils_1.isValueOk)(temp.max)) {
      return null;
    }
    return {
      start: temp.min,
      end: temp.max
    };
  }
  handleParameterNotFound(paramName, ifParamNotFound) {
    const action = ifParamNotFound ?? this._ifParamNotFound;
    return action === "show-in-legend" ? this._emptyCds : null;
  }
}
exports.FdoatDataTransformer = FdoatDataTransformer;
// MARK: helper functions
function paramToTimes(p, tStart) {
  return Array.from({
    length: p.values.length
  }).map((_, i) => p.t1 + i * p.period - tStart);
}
function selectReference(pLat, pLon) {
  if (pLat.period < pLon.period) {
    return "lat";
  }
  if (pLon.period < pLat.period) {
    return "lon";
  }
  const useLon = (pLat.shift - pLon.shift) % pLat.period > 0.5 * pLat.period;
  return useLon ? "lon" : "lat";
}
/**
 * @param p The parameter to reinterpolate
 * @param pRef The reference parameter
 * @param interpolation Interpolation method
 * @returns Values of p reinterpolated to match the times of pRef
 */
function reinterpolateParameter(p, pRef, interpolation) {
  const values1 = p.values.map(x => x == null ? NaN : x);
  if (interpolation === "linear") {
    return pRef.values.map((_, i) => {
      const t2 = pRef.t1 + i * pRef.period;
      if (t2 <= p.t1) {
        return values1[0];
      } else if (t2 >= p.t1 + (p.values.length - 1) * p.period) {
        return values1[values1.length - 1];
      } else {
        const index = Math.floor((t2 - p.t1) / p.period);
        if (index < 0 || index >= p.values.length) {
          return NaN;
        }
        const pond = (p.t1 + (index + 1) * p.period - t2) / p.period;
        return pond * values1[index] + (1 - pond) * values1[index + 1];
      }
    });
  } else {
    return pRef.values.map((_, i) => {
      const t2 = pRef.t1 + i * pRef.period;
      if (t2 <= p.t1) {
        return values1[0];
      } else if (t2 >= p.t1 + (p.values.length - 1) * p.period) {
        return values1[values1.length - 1];
      } else {
        const index = Math.floor((t2 - p.t1) / p.period);
        if (index < 0 || index >= p.values.length) {
          return NaN;
        }
        return values1[index];
      }
    });
  }
}

/***/ }),

/***/ "./src/webviews/plots/data-transformers/data-transformer.ts":
/*!******************************************************************!*\
  !*** ./src/webviews/plots/data-transformers/data-transformer.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.DataTransformer = void 0;
class DataTransformer {}
exports.DataTransformer = DataTransformer;

/***/ }),

/***/ "./src/webviews/plots/data-transformers/index.ts":
/*!*******************************************************!*\
  !*** ./src/webviews/plots/data-transformers/index.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.CsvDataTransformer = exports.FdoatDataTransformer = exports.DataTransformer = void 0;
var data_transformer_1 = __webpack_require__(/*! ./data-transformer */ "./src/webviews/plots/data-transformers/data-transformer.ts");
Object.defineProperty(exports, "DataTransformer", ({
  enumerable: true,
  get: function () {
    return data_transformer_1.DataTransformer;
  }
}));
var data_transformer_fdoat_1 = __webpack_require__(/*! ./data-transformer-fdoat */ "./src/webviews/plots/data-transformers/data-transformer-fdoat.ts");
Object.defineProperty(exports, "FdoatDataTransformer", ({
  enumerable: true,
  get: function () {
    return data_transformer_fdoat_1.FdoatDataTransformer;
  }
}));
var data_transformer_csv_1 = __webpack_require__(/*! ./data-transformer-csv */ "./src/webviews/plots/data-transformers/data-transformer-csv.ts");
Object.defineProperty(exports, "CsvDataTransformer", ({
  enumerable: true,
  get: function () {
    return data_transformer_csv_1.CsvDataTransformer;
  }
}));

/***/ }),

/***/ "./src/webviews/plots/global.ts":
/*!**************************************!*\
  !*** ./src/webviews/plots/global.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.g = void 0;
exports.writeConfigToLocalStorage = writeConfigToLocalStorage;
// MARK: storage
function parseStoredConfig(x) {
  if (x == null) {
    e(`input is null`);
  }
  if (typeof x !== "object") {
    e(`input is not an object`);
  }
  if (!("toolbars" in x)) {
    e(`input has no "toolbars" key`);
  }
  if (!("wheelEvents" in x)) {
    e(`input has no "wheelEvents" key`);
  }
  if (!("dragAndDrop" in x)) {
    e(`input has no "dragAndDrop" key`);
  }
  if (!("map" in x)) {
    e(`input has no "map" key`);
  }
  if (typeof x.toolbars.translationFactorX !== "number") {
    e(`input.toolbars.translationFactorX is not a number`);
  }
  if (typeof x.toolbars.translationFactorY !== "number") {
    e(`input.toolbars.translationFactorY is not a number`);
  }
  if (typeof x.toolbars.zoomFactorX !== "number") {
    e(`input.toolbars.zoomFactorX is not a number`);
  }
  if (typeof x.toolbars.zoomFactorY !== "number") {
    e(`input.toolbars.zoomFactorY is not a number`);
  }
  if (typeof x.toolbars.marginFactorX !== "number") {
    e(`input.toolbars.marginFactorX is not a number`);
  }
  if (typeof x.toolbars.marginFactorY !== "number") {
    e(`input.toolbars.marginFactorY is not a number`);
  }
  if (!["none", "zoom-x", "pan-x"].includes(x.wheelEvents.onXAxis)) {
    e(`input.wheelEvents.onXAxis: unsupported value "${x.wheelEvents.onXAxis}"`);
  }
  if (!["none", "zoom-y", "pan-y"].includes(x.wheelEvents.onYAxis)) {
    e(`input.wheelEvents.onYAxis: unsupported value "${x.wheelEvents.onYAxis}"`);
  }
  if (!["none", "zoom-x", "zoom-y", "zoom", "pan-x", "pan-y"].includes(x.wheelEvents.onFrame)) {
    e(`input.wheelEvents.onFrame: unsupported value "${x.wheelEvents.onFrame}"`);
  }
  if (typeof x.dragAndDrop.limitInView !== "boolean") {
    e(`input.dragAndDrop.limitInView is not a boolean`);
  }
  if (!["none", "pan-x"].includes(x.dragAndDrop.onXAxis)) {
    e(`input.dragAndDrop.onXAxis: unsupported value "${x.dragAndDrop.onXAxis}"`);
  }
  if (!["none", "pan-y"].includes(x.dragAndDrop.onYAxis)) {
    e(`input.dragAndDrop.onYAxis: unsupported value "${x.dragAndDrop.onYAxis}"`);
  }
  if (!["none", "multi-box-zoom", "box-zoom", "box-zoom-x", "box-zoom-y", "pan", "pan-x", "pan-y"].includes(x.dragAndDrop.onFrameWithLeftButton)) {
    e(`input.dragAndDrop.onFrameWithLeftButton: unspported value "${x.dragAndDrop.onFrameWithLeftButton}"`);
  }
  if (!["none", "multi-box-zoom", "box-zoom", "box-zoom-x", "box-zoom-y", "pan", "pan-x", "pan-y"].includes(x.dragAndDrop.onFrameWithMiddleButton)) {
    e(`input.dragAndDrop.onFrameWithMiddleButton: unspported value "${x.dragAndDrop.onFrameWithMiddleButton}"`);
  }
  if (!["none", "multi-box-zoom", "box-zoom", "box-zoom-x", "box-zoom-y", "pan", "pan-x", "pan-y"].includes(x.dragAndDrop.onFrameWithRightButton)) {
    e(`input.dragAndDrop.onFrameWithRightButton: unspported value "${x.dragAndDrop.onFrameWithRightButton}"`);
  }
  if (!["no", "on-other-plots-only"].includes(x.dragAndDrop.adjustYRangeAfterBoxZoom)) {
    e(`input.dragAndDrop.adjustYRangeAfterBoxZoom: unspported value "${x.dragAndDrop.adjustYRangeAfterBoxZoom}"`);
  }
  if (!["no", "on-all-plots"].includes(x.dragAndDrop.adjustYRangeAfterXZoom)) {
    e(`input.dragAndDrop.adjustYRangeAfterXZoom: unspported value "${x.dragAndDrop.adjustYRangeAfterXZoom}"`);
  }
  if (!["full", "only-in-timerange", "transparent-outside-timerange"].includes(x.map.displayMode)) {
    e(`input.map.displayMode: unspported value "${x.map.displayMode}"`);
  }
  if (typeof x.map.transparencyCoefficient !== "number") {
    e(`input.map.transparencyCoefficient is not a number`);
  }
  return x;
}
function e(msg) {
  throw new Error(`Config parsing error: ${msg}`);
}
function readConfigFromLocalStorage() {
  try {
    const str = localStorage.getItem("config");
    if (str == null) {
      throw new Error();
    }
    const config = parseStoredConfig(JSON.parse(str));
    exports.g.config.toolbars.translationFactorX = config.toolbars.translationFactorX;
    exports.g.config.toolbars.translationFactorY = config.toolbars.translationFactorY;
    exports.g.config.toolbars.zoomFactorX = config.toolbars.zoomFactorX;
    exports.g.config.toolbars.zoomFactorY = config.toolbars.zoomFactorY;
    exports.g.config.toolbars.marginFactorX = config.toolbars.marginFactorX;
    exports.g.config.toolbars.marginFactorY = config.toolbars.marginFactorY;
    exports.g.config.wheelEvents.onXAxis = config.wheelEvents.onXAxis;
    exports.g.config.wheelEvents.onYAxis = config.wheelEvents.onYAxis;
    exports.g.config.wheelEvents.onFrame = config.wheelEvents.onFrame;
    exports.g.config.dragAndDrop.limitInView = config.dragAndDrop.limitInView;
    exports.g.config.dragAndDrop.onXAxis = config.dragAndDrop.onXAxis;
    exports.g.config.dragAndDrop.onYAxis = config.dragAndDrop.onYAxis;
    exports.g.config.dragAndDrop.onFrameWithLeftButton = config.dragAndDrop.onFrameWithLeftButton;
    exports.g.config.dragAndDrop.onFrameWithMiddleButton = config.dragAndDrop.onFrameWithMiddleButton;
    exports.g.config.dragAndDrop.onFrameWithRightButton = config.dragAndDrop.onFrameWithRightButton;
    exports.g.config.dragAndDrop.adjustYRangeAfterBoxZoom = config.dragAndDrop.adjustYRangeAfterBoxZoom;
    exports.g.config.dragAndDrop.adjustYRangeAfterXZoom = config.dragAndDrop.adjustYRangeAfterXZoom;
    exports.g.config.map.displayMode = config.map.displayMode;
    exports.g.config.map.transparencyCoefficient = config.map.transparencyCoefficient;
    console.info("Configuration loaded from local storage");
    return true;
  } catch (e) {
    console.warn("Failed to load config from local storage");
    return false;
  }
}
function writeConfigToLocalStorage() {
  try {
    const configToStore = {
      toolbars: {
        translationFactorX: exports.g.config.toolbars.translationFactorX,
        translationFactorY: exports.g.config.toolbars.translationFactorY,
        zoomFactorX: exports.g.config.toolbars.zoomFactorX,
        zoomFactorY: exports.g.config.toolbars.zoomFactorY,
        marginFactorX: exports.g.config.toolbars.marginFactorX,
        marginFactorY: exports.g.config.toolbars.marginFactorY
      },
      wheelEvents: {
        onXAxis: exports.g.config.wheelEvents.onXAxis,
        onYAxis: exports.g.config.wheelEvents.onYAxis,
        onFrame: exports.g.config.wheelEvents.onFrame
      },
      dragAndDrop: {
        limitInView: exports.g.config.dragAndDrop.limitInView,
        onXAxis: exports.g.config.dragAndDrop.onXAxis,
        onYAxis: exports.g.config.dragAndDrop.onYAxis,
        onFrameWithLeftButton: exports.g.config.dragAndDrop.onFrameWithLeftButton,
        onFrameWithMiddleButton: exports.g.config.dragAndDrop.onFrameWithMiddleButton,
        onFrameWithRightButton: exports.g.config.dragAndDrop.onFrameWithRightButton,
        adjustYRangeAfterBoxZoom: exports.g.config.dragAndDrop.adjustYRangeAfterBoxZoom,
        adjustYRangeAfterXZoom: exports.g.config.dragAndDrop.adjustYRangeAfterXZoom
      },
      map: {
        displayMode: exports.g.config.map.displayMode,
        transparencyCoefficient: exports.g.config.map.transparencyCoefficient
      }
    };
    localStorage.setItem("config", JSON.stringify(configToStore));
    console.info("Configuration saved to local storage");
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}
// MARK: value
const zoomCoeff = Math.log(1.2) / 120; // 1.2 scale factor for 120 eighth deg mouse scroll
const defaultToolbarTranslationFactorX = 0.25;
const defaultToolbarTranslationFactorY = 0.25;
const defaultToolbarZoomFactorX = 1.4;
const defaultToolbarZoomFactorY = 1.4;
const defaultToolbarMarginFactorX = 0.05;
const defaultToolbarMarginFactorY = 0.05;
const defaultBehaviorOnWheelOnXAxis = "zoom-x";
const defaultBehaviorOnWheelOnYAxis = "zoom-y";
const defaultBehaviorOnWheelOnFrame = "zoom-y";
const defaultDndMinimalDragDistance = 8;
const defaultDndMinimalBoxZoomDistance = 20;
const defaultDndLimitInView = false;
const defaultDndBehaviorDraggingXAxis = "pan-x";
const defaultDndBehaviorDraggingYAxis = "pan-y";
const defaultDndBehaviorDraggingFrameWithLeftButton = "multi-box-zoom";
const defaultDndBehaviorDraggingFrameWithMiddleButton = "pan";
const defaultDndBehaviorDraggingFrameWithRightButton = "pan-y";
const defaultDndAdjustYRangeAfterBoxZoom = "on-other-plots-only";
const defaultDndAdjustYRangeAfterXZoom = "on-all-plots";
const defaultMapDisplayMode = "transparent-outside-timerange";
const defaultMapTransparencyCoeff = 0.25;
exports.g = {
  config: {
    toolbars: {
      translationFactorX: defaultToolbarTranslationFactorX,
      translationFactorY: defaultToolbarTranslationFactorY,
      zoomFactorX: defaultToolbarZoomFactorX,
      zoomFactorY: defaultToolbarZoomFactorY,
      marginFactorX: defaultToolbarMarginFactorX,
      marginFactorY: defaultToolbarMarginFactorY
    },
    wheelEvents: {
      onXAxis: defaultBehaviorOnWheelOnXAxis,
      onYAxis: defaultBehaviorOnWheelOnYAxis,
      onFrame: defaultBehaviorOnWheelOnFrame,
      deltaToZoomFactorX: delta => delta < 0 ? Math.exp(zoomCoeff * delta) : 1 + zoomCoeff * delta,
      deltaToZoomFactorY: delta => delta < 0 ? Math.exp(zoomCoeff * delta) : 1 + zoomCoeff * delta,
      deltaToTranslationFactorX: delta => delta * 0.001,
      deltaToTranslationFactorY: delta => delta * 0.001
    },
    dragAndDrop: {
      minimalDragDistance: defaultDndMinimalDragDistance,
      minimalBoxZoomDistance: defaultDndMinimalBoxZoomDistance,
      limitInView: defaultDndLimitInView,
      onXAxis: defaultDndBehaviorDraggingXAxis,
      onYAxis: defaultDndBehaviorDraggingYAxis,
      onFrameWithLeftButton: defaultDndBehaviorDraggingFrameWithLeftButton,
      onFrameWithMiddleButton: defaultDndBehaviorDraggingFrameWithMiddleButton,
      onFrameWithRightButton: defaultDndBehaviorDraggingFrameWithRightButton,
      adjustYRangeAfterBoxZoom: defaultDndAdjustYRangeAfterBoxZoom,
      adjustYRangeAfterXZoom: defaultDndAdjustYRangeAfterXZoom
    },
    map: {
      displayMode: defaultMapDisplayMode,
      transparencyCoefficient: defaultMapTransparencyCoeff
    }
  },
  state: {
    mode: "none"
  }
};
readConfigFromLocalStorage();

/***/ }),

/***/ "./src/webviews/plots/interactions/crosshair.ts":
/*!******************************************************!*\
  !*** ./src/webviews/plots/interactions/crosshair.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addCrosshair = addCrosshair;
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
function addCrosshair(plots) {
  plots.forEach(plot => {
    const plotMode = plot.getConfig().mode;
    const onMouseMoveOrOver = event => {
      const {
        x,
        y
      } = (0, utils_1.computePositionInPlotReference)(plot, event);
      plots.forEach(plot2 => {
        const plotMode2 = plot2.getConfig().mode;
        plot2.elements.interactibles.crosshair.hline.style.display = "none";
        plot2.elements.interactibles.crosshair.vline.style.display = plotMode !== "map" && plotMode2 !== "map" ? "block" : "none";
        plot2.elements.interactibles.crosshair.xvalue.style.display = "none";
        plot2.elements.interactibles.crosshair.yvalue.style.display = "none";
        plot2.elements.interactibles.crosshair.vline.style.left = `${event.offsetX - 1}px`;
        if (plotMode !== "map" && plotMode2 === "map") {
          const curves = plot2.getCurves();
          plot2.elements.interactibles.crosshair.aircraftSymbols.forEach((acs, i) => {
            const curve = curves[i];
            if (!curve.line.visible) {
              acs.style.display = "none";
              return;
            }
            // @ts-ignore
            const index = (0, utils_1.getPreviousByDichotomy)(curve.dataSource.data["t"], x);
            if (index == null) {
              acs.style.display = "none";
              return;
            }
            // @ts-ignore
            const xLons = curve.dataSource.data["x"];
            // @ts-ignore
            const yLats = curve.dataSource.data["y"];
            const xLon = (0, utils_1.getLastValueOkBefore)(xLons, index);
            const yLat = (0, utils_1.getLastValueOkBefore)(yLats, index);
            if (xLon === undefined || yLat === undefined) {
              acs.style.display = "none";
              return;
            }
            const {
              x: offsetX,
              y: offsetY
            } = (0, utils_1.computePositionInElementReference)(plot2, xLon, yLat);
            acs.style.display = "block";
            acs.style.left = `${offsetX}px`;
            acs.style.top = `${offsetY}px`;
          });
        }
      });
      plot.elements.interactibles.crosshair.hline.style.display = "block";
      plot.elements.interactibles.crosshair.vline.style.display = "block";
      plot.elements.interactibles.crosshair.xvalue.style.display = "inline";
      plot.elements.interactibles.crosshair.yvalue.style.display = plotMode === "booleans" ? "none" : "inline";
      plot.elements.interactibles.crosshair.hline.style.top = `${event.offsetY - 1}px`;
      plot.elements.interactibles.crosshair.vline.style.left = `${event.offsetX - 1}px`;
      plot.elements.interactibles.crosshair.yvalue.style.top = `${event.offsetY - 1}px`;
      plot.elements.interactibles.crosshair.xvalue.style.left = `${event.offsetX - 1}px`;
      if (plotMode !== "map") {
        plot.elements.interactibles.crosshair.xvalue.innerHTML = computeXValueText(x);
        plot.elements.interactibles.crosshair.yvalue.innerHTML = computeYValueText(y);
      } else {
        plot.elements.interactibles.crosshair.xvalue.innerHTML = utils_1.mercator.xToLon(x).toFixed(5);
        plot.elements.interactibles.crosshair.yvalue.innerHTML = utils_1.mercator.yToLat(y).toFixed(5);
      }
    };
    plot.elements.frame.addEventListener("mouseover", event => {
      onMouseMoveOrOver(event);
    });
    plot.elements.frame.addEventListener("mousemove", event => {
      onMouseMoveOrOver(event);
    });
    plot.elements.frame.addEventListener("mouseout", event => {
      plots.forEach(plot2 => {
        plot2.elements.interactibles.crosshair.hline.style.display = "none";
        plot2.elements.interactibles.crosshair.vline.style.display = "none";
        plot2.elements.interactibles.crosshair.xvalue.style.display = "none";
        plot2.elements.interactibles.crosshair.yvalue.style.display = "none";
        plot2.elements.interactibles.crosshair.aircraftSymbols.forEach(acs => {
          acs.style.display = "none";
        });
      });
    });
  });
}
function computeXValueText(value) {
  return value.toFixed(2);
}
function computeYValueText(value) {
  if (value >= 1e+12) {
    return expNumString(value);
  } else if (value >= 1e+9) {
    return `${(value * 1e-9).toFixed(3)}b`;
  } else if (value >= 1e+6) {
    return `${(value * 1e-6).toFixed(3)}m`;
  } else if (value >= 1e+3) {
    return `${(value * 1e-3).toFixed(3)}k`;
  } else if (value >= 0.01) {
    return value.toFixed(3);
  } else if (value <= -1e+12) {
    return expNumString(value);
  } else if (value <= -1e+9) {
    return `${(value * 1e-9).toFixed(3)}b`;
  } else if (value <= -1e+6) {
    return `${(value * 1e-6).toFixed(3)}m`;
  } else if (value <= -1e+3) {
    return `${(value * 1e-3).toFixed(3)}k`;
  } else if (value <= -0.01) {
    return value.toFixed(3);
  }
  return expNumString(value);
}
function expNumString(value) {
  const str = value.toExponential(2);
  const match = str.match(/^(.*)e(.*)/);
  if (match == null) {
    return str;
  }
  const mantissa = match[1];
  const exponent = match[2].replace("+", "");
  return `${mantissa} 10<sup>${exponent}</sup>`;
}

/***/ }),

/***/ "./src/webviews/plots/interactions/dnd-events.ts":
/*!*******************************************************!*\
  !*** ./src/webviews/plots/interactions/dnd-events.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addDndEvents = addDndEvents;
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
const global_1 = __webpack_require__(/*! ../global */ "./src/webviews/plots/global.ts");
function addDndEvents(plots) {
  // MARK: set zoom gui mode
  function setZoomGuiMode(mode, index) {
    plots.forEach((plot, i) => {
      if (plot.getConfig().mode === "map") {
        return;
      }
      const showBandX = mode === "x";
      const showBandY = mode === "y" && index === i;
      const showRect = mode === "xy" && index === i;
      plot.elements.interactibles.selectionBandX.style.display = showBandX ? "block" : "none";
      plot.elements.interactibles.selectionBandY.style.display = showBandY ? "block" : "none";
      plot.elements.interactibles.selectionRect.style.display = showRect ? "block" : "none";
    });
  }
  // @3: define the tools
  // MARK: box-zoom
  const boxZoom = {
    start: (plots, index, event) => {
      const {
        x: plotX,
        y: plotY
      } = (0, utils_1.computePositionInPlotReference)(plots[index], event);
      global_1.g.state = {
        mode: "box-zoom",
        button: event.button,
        plots,
        index,
        start: {
          clientX: event.clientX,
          clientY: event.clientY,
          plotX,
          plotY
        }
      };
    },
    update: event => {
      if (global_1.g.state.mode !== "box-zoom") {
        return;
      }
      const distance = Math.abs(event.clientX - global_1.g.state.start.clientX) + Math.abs(event.clientY - global_1.g.state.start.clientY);
      if (distance < global_1.g.config.dragAndDrop.minimalDragDistance) {
        setZoomGuiMode(null, -1);
        return;
      }
      setZoomGuiMode("xy", global_1.g.state.index);
      setZoomBox(event);
      // const {x, y} = computePositionInPlotReference(g.state.plot, g.state.elt, event);
      // console.log(`mousemove: ${g.state.mode} of plot ${(g.state.numPlot ?? NaN)+1} at x=${x.toFixed(3)}, y=${y.toFixed(3)}`);
    },
    end: event => {
      if (global_1.g.state.mode !== "box-zoom") {
        return;
      }
      setZoomGuiMode(null, -1);
      const distance = Math.abs(event.clientX - global_1.g.state.start.clientX) + Math.abs(event.clientY - global_1.g.state.start.clientY);
      if (distance < global_1.g.config.dragAndDrop.minimalDragDistance) {
        global_1.g.state = {
          mode: "none"
        };
        return;
      }
      dropZoomBox(event);
      global_1.g.state = {
        mode: "none"
      };
      // console.log(`mouseup at x=${x.toFixed(3)}, y=${y.toFixed(3)}`);
    },
    cancel: () => {
      setZoomGuiMode(null, -1);
      global_1.g.state = {
        mode: "none"
      };
    }
  };
  function setZoomBox(event) {
    if (global_1.g.state.mode !== "box-zoom" && global_1.g.state.mode !== "multi-box-zoom") {
      return;
    }
    const rect = global_1.g.state.plots[global_1.g.state.index].elements.frame.getBoundingClientRect();
    const top = Math.min(global_1.g.state.start.clientY, event.clientY) - rect.top;
    const bottom = rect.bottom - Math.max(global_1.g.state.start.clientY, event.clientY);
    const left = Math.min(global_1.g.state.start.clientX, event.clientX) - rect.left;
    const right = rect.right - Math.max(global_1.g.state.start.clientX, event.clientX);
    global_1.g.state.plots[global_1.g.state.index].elements.interactibles.selectionRect.style.top = `${top - 1}px`;
    global_1.g.state.plots[global_1.g.state.index].elements.interactibles.selectionRect.style.bottom = `${bottom - 1}px`;
    global_1.g.state.plots[global_1.g.state.index].elements.interactibles.selectionRect.style.left = `${left - 1}px`;
    global_1.g.state.plots[global_1.g.state.index].elements.interactibles.selectionRect.style.right = `${right - 1}px`;
  }
  function dropZoomBox(event) {
    if (global_1.g.state.mode !== "box-zoom" && global_1.g.state.mode !== "multi-box-zoom") {
      return;
    }
    const plot = global_1.g.state.plots[global_1.g.state.index];
    const {
      x,
      y
    } = (0, utils_1.computePositionInPlotReference)(plot, event);
    plot.setXRange(Math.min(global_1.g.state.start.plotX, x), Math.max(global_1.g.state.start.plotX, x));
    plot.setYRange(Math.min(global_1.g.state.start.plotY, y), Math.max(global_1.g.state.start.plotY, y));
    global_1.g.state.plots.forEach((p, i) => {
      if (global_1.g.config.dragAndDrop.adjustYRangeAfterBoxZoom === "on-other-plots-only" && p.getConfig().mode !== "booleans" && (global_1.g.state.mode === "box-zoom" || global_1.g.state.mode === "multi-box-zoom") && i !== global_1.g.state.index) {
        p.fitContentY();
      }
    });
  }
  // MARK: box-zoom-x
  const boxZoomX = {
    start: (plots, index, event) => {
      const {
        x: plotX,
        y: plotY
      } = (0, utils_1.computePositionInPlotReference)(plots[index], event);
      global_1.g.state = {
        mode: "box-zoom-x",
        button: event.button,
        plots,
        index,
        start: {
          clientX: event.clientX,
          clientY: event.clientY,
          plotX,
          plotY
        }
      };
    },
    update: event => {
      if (global_1.g.state.mode !== "box-zoom-x") {
        return;
      }
      const distance = Math.abs(event.clientX - global_1.g.state.start.clientX);
      if (distance < 0.5 * global_1.g.config.dragAndDrop.minimalDragDistance) {
        setZoomGuiMode(null, -1);
        return;
      }
      setZoomGuiMode("x", global_1.g.state.index);
      setZoomBandX(event);
      // const {x} = computePositionInPlotReference(g.state.plot, g.state.elt, event);
      // console.log(`mousemove: ${g.state.mode} of plot ${(g.state.numPlot ?? NaN)+1} at x=${x.toFixed(3)}`);
    },
    end: event => {
      if (global_1.g.state.mode !== "box-zoom-x") {
        return;
      }
      setZoomGuiMode(null, -1);
      const distance = Math.abs(event.clientX - global_1.g.state.start.clientX);
      if (distance < 0.5 * global_1.g.config.dragAndDrop.minimalDragDistance) {
        global_1.g.state = {
          mode: "none"
        };
        return;
      }
      dropZoomBandX(event);
      global_1.g.state = {
        mode: "none"
      };
      // console.log(`mouseup at x=${x.toFixed(3)}`);
    },
    cancel: () => {
      setZoomGuiMode(null, -1);
      global_1.g.state = {
        mode: "none"
      };
    }
  };
  function setZoomBandX(event) {
    if (global_1.g.state.mode !== "box-zoom-x" && global_1.g.state.mode !== "multi-box-zoom") {
      return;
    }
    global_1.g.state.plots.forEach(plot => {
      if (global_1.g.state.mode !== "box-zoom-x" && global_1.g.state.mode !== "multi-box-zoom") {
        return;
      }
      const rect = plot.elements.frame.getBoundingClientRect();
      const left = Math.min(global_1.g.state.start.clientX, event.clientX) - rect.left;
      const right = rect.right - Math.max(global_1.g.state.start.clientX, event.clientX);
      plot.elements.interactibles.selectionBandX.style.left = `${left - 1}px`;
      plot.elements.interactibles.selectionBandX.style.right = `${right - 1}px`;
    });
  }
  function dropZoomBandX(event) {
    if (global_1.g.state.mode !== "box-zoom-x" && global_1.g.state.mode !== "multi-box-zoom") {
      return;
    }
    const plot = global_1.g.state.plots[global_1.g.state.index];
    const {
      x
    } = (0, utils_1.computePositionInPlotReference)(plot, event);
    plot.setXRange(Math.min(global_1.g.state.start.plotX, x), Math.max(global_1.g.state.start.plotX, x));
    global_1.g.state.plots.forEach(p => {
      if (global_1.g.config.dragAndDrop.adjustYRangeAfterXZoom === "on-all-plots" && p.getConfig().mode !== "booleans") {
        p.fitContentY();
      }
    });
  }
  // MARK: box-zoom-y
  const boxZoomY = {
    start: (plots, index, event) => {
      const {
        x: plotX,
        y: plotY
      } = (0, utils_1.computePositionInPlotReference)(plots[index], event);
      global_1.g.state = {
        mode: "box-zoom-y",
        button: event.button,
        plots,
        index,
        start: {
          clientX: event.clientX,
          clientY: event.clientY,
          plotX,
          plotY
        }
      };
    },
    update: event => {
      if (global_1.g.state.mode !== "box-zoom-y") {
        return;
      }
      const distance = Math.abs(event.clientY - global_1.g.state.start.clientY);
      if (distance < 0.5 * global_1.g.config.dragAndDrop.minimalDragDistance) {
        setZoomGuiMode(null, -1);
        return;
      }
      setZoomGuiMode("y", global_1.g.state.index);
      setZoomBandY(event);
      // const {y} = computePositionInPlotReference(g.state.plot, g.state.elt, event);
      // console.log(`mousemove: ${g.state.mode} of plot ${(g.state.numPlot ?? NaN)+1} at y=${y.toFixed(3)}`);
    },
    end: event => {
      if (global_1.g.state.mode !== "box-zoom-y") {
        return;
      }
      setZoomGuiMode(null, -1);
      const distance = Math.abs(event.clientY - global_1.g.state.start.clientY);
      if (distance < 0.5 * global_1.g.config.dragAndDrop.minimalDragDistance) {
        global_1.g.state = {
          mode: "none"
        };
        return;
      }
      dropZoomBandY(event);
      global_1.g.state = {
        mode: "none"
      };
      // console.log(`mouseup at y=${y.toFixed(3)}`);
    },
    cancel: () => {
      setZoomGuiMode(null, -1);
      global_1.g.state = {
        mode: "none"
      };
    }
  };
  function setZoomBandY(event) {
    if (global_1.g.state.mode !== "box-zoom-y" && global_1.g.state.mode !== "multi-box-zoom") {
      return;
    }
    const rect = global_1.g.state.plots[global_1.g.state.index].elements.frame.getBoundingClientRect();
    const top = Math.min(global_1.g.state.start.clientY, event.clientY) - rect.top;
    const bottom = rect.bottom - Math.max(global_1.g.state.start.clientY, event.clientY);
    global_1.g.state.plots[global_1.g.state.index].elements.interactibles.selectionBandY.style.top = `${top - 1}px`;
    global_1.g.state.plots[global_1.g.state.index].elements.interactibles.selectionBandY.style.bottom = `${bottom - 1}px`;
  }
  function dropZoomBandY(event) {
    if (global_1.g.state.mode !== "box-zoom-y" && global_1.g.state.mode !== "multi-box-zoom") {
      return;
    }
    const plot = global_1.g.state.plots[global_1.g.state.index];
    const {
      y
    } = (0, utils_1.computePositionInPlotReference)(plot, event);
    plot.setYRange(Math.min(global_1.g.state.start.plotY, y), Math.max(global_1.g.state.start.plotY, y));
  }
  // MARK: multi-box-zoom
  const multiBoxZoom = {
    start: (plots, index, event) => {
      const {
        x: plotX,
        y: plotY
      } = (0, utils_1.computePositionInPlotReference)(plots[index], event);
      global_1.g.state = {
        mode: "multi-box-zoom",
        button: event.button,
        plots,
        index,
        start: {
          clientX: event.clientX,
          clientY: event.clientY,
          plotX,
          plotY
        }
      };
    },
    update: event => {
      if (global_1.g.state.mode !== "multi-box-zoom") {
        return;
      }
      const zoomMode = computeZoomMode(event);
      if (zoomMode === "xy") {
        setZoomGuiMode("xy", global_1.g.state.index);
        setZoomBox(event);
      } else if (zoomMode === "x") {
        setZoomGuiMode("x", global_1.g.state.index);
        setZoomBandX(event);
      } else if (zoomMode === "y") {
        setZoomGuiMode("y", global_1.g.state.index);
        setZoomBandY(event);
      } else {
        setZoomGuiMode(null, -1);
      }
      // const {x, y} = computePositionInPlotReference(g.state.plot, g.state.elt, event);
      // console.log(`mousemove: ${g.state.mode} of plot ${(g.state.numPlot ?? NaN)+1} at x=${x.toFixed(3)}, y=${y.toFixed(3)}`);
    },
    end: event => {
      if (global_1.g.state.mode !== "multi-box-zoom") {
        return;
      }
      setZoomGuiMode(null, -1);
      const zoomMode = computeZoomMode(event);
      if (zoomMode === "xy") {
        dropZoomBox(event);
      } else if (zoomMode === "x") {
        dropZoomBandX(event);
      } else if (zoomMode === "y") {
        dropZoomBandY(event);
      }
      global_1.g.state = {
        mode: "none"
      };
    },
    cancel: () => {
      setZoomGuiMode(null, -1);
      global_1.g.state = {
        mode: "none"
      };
    }
  };
  function computeZoomMode(event) {
    if (global_1.g.state.mode !== "multi-box-zoom") {
      return null;
    }
    const dx = Math.abs(global_1.g.state.start.clientX - event.clientX);
    const dy = Math.abs(global_1.g.state.start.clientY - event.clientY);
    // same logic as plotly (https://github.com/plotly/plotly.js/blob/master/src/plots/cartesian/dragbox.js)
    if (dy < Math.min(Math.max(0.6 * dx, global_1.g.config.dragAndDrop.minimalDragDistance), global_1.g.config.dragAndDrop.minimalBoxZoomDistance)) {
      return dx < global_1.g.config.dragAndDrop.minimalDragDistance ? null : "x";
    } else if (dx < Math.min(0.6 * dy, global_1.g.config.dragAndDrop.minimalBoxZoomDistance)) {
      return "y";
    } else {
      return "xy";
    }
  }
  // MARK: pan
  const pan = {
    start: (plot, event) => {
      const rect = plot.elements.frame.getBoundingClientRect();
      const xRange = plot.getXRange();
      const yRange = plot.getYRange();
      global_1.g.state = {
        mode: "pan",
        button: event.button,
        plot,
        start: {
          clientX: event.clientX,
          clientY: event.clientY,
          ratioX: (xRange.end - xRange.start) / rect.width,
          ratioY: (yRange.end - yRange.start) / rect.height,
          rangeX: {
            start: xRange.start,
            end: xRange.end
          },
          rangeY: {
            start: yRange.start,
            end: yRange.end
          }
        }
      };
    },
    update: event => {
      if (global_1.g.state.mode !== "pan") {
        return;
      }
      const offsetX = global_1.g.state.start.ratioX * (event.clientX - global_1.g.state.start.clientX);
      const offsetY = global_1.g.state.start.ratioY * (event.clientY - global_1.g.state.start.clientY);
      global_1.g.state.plot.setXRange(global_1.g.state.start.rangeX.start - offsetX, global_1.g.state.start.rangeX.end - offsetX);
      global_1.g.state.plot.setYRange(global_1.g.state.start.rangeY.start + offsetY, global_1.g.state.start.rangeY.end + offsetY);
    },
    end: event => {
      global_1.g.state = {
        mode: "none"
      };
    }
  };
  // MARK: pan-x
  const panX = {
    start: (plot, event) => {
      const xRange = plot.getXRange();
      global_1.g.state = {
        mode: "pan-x",
        button: event.button,
        plot,
        start: {
          clientX: event.clientX,
          ratio: (xRange.end - xRange.start) / plot.elements.frame.getBoundingClientRect().width,
          range: {
            start: xRange.start,
            end: xRange.end
          }
        }
      };
    },
    update: event => {
      if (global_1.g.state.mode !== "pan-x") {
        return;
      }
      const offset = global_1.g.state.start.ratio * (event.clientX - global_1.g.state.start.clientX);
      global_1.g.state.plot.setXRange(global_1.g.state.start.range.start - offset, global_1.g.state.start.range.end - offset);
    },
    end: event => {
      global_1.g.state = {
        mode: "none"
      };
    }
  };
  // MARK: pan-y
  const panY = {
    start: (plot, event) => {
      const yRange = plot.getYRange();
      global_1.g.state = {
        mode: "pan-y",
        button: event.button,
        plot,
        start: {
          clientY: event.clientY,
          ratio: (yRange.end - yRange.start) / plot.elements.frame.getBoundingClientRect().height,
          range: {
            start: yRange.start,
            end: yRange.end
          }
        }
      };
    },
    update: event => {
      if (global_1.g.state.mode !== "pan-y") {
        return;
      }
      const offset = global_1.g.state.start.ratio * (event.clientY - global_1.g.state.start.clientY);
      global_1.g.state.plot.setYRange(global_1.g.state.start.range.start + offset, global_1.g.state.start.range.end + offset);
    },
    end: event => {
      global_1.g.state = {
        mode: "none"
      };
    }
  };
  // @3: register the events listeners
  plots.forEach((plot, i) => {
    // MARK: mouse down on frame
    plot.elements.frame.addEventListener("mousedown", event => {
      if (global_1.g.state.mode !== "none") {
        return;
      }
      if (event.button !== 0 && event.button !== 1 && event.button !== 2) {
        return;
      }
      // console.log(`mousedown on frame of plot ${i+1} at x=${plotX.toFixed(3)}, y=${plotY.toFixed(3)}`);
      const plotConfig = plot.getConfig();
      const normalPlot = plotConfig.mode === "normal";
      const boolPlot = plotConfig.mode === "booleans";
      const mapPlot = plotConfig.mode === "map";
      const action = event.button === 0 ? global_1.g.config.dragAndDrop.onFrameWithLeftButton : event.button === 1 ? global_1.g.config.dragAndDrop.onFrameWithMiddleButton : global_1.g.config.dragAndDrop.onFrameWithRightButton;
      const bMultiBoxZoom = normalPlot && action === "multi-box-zoom";
      const bBoxZoom = normalPlot && action === "box-zoom";
      const bBoxZoomX = !mapPlot && (action === "box-zoom-x" || action === "multi-box-zoom" && boolPlot || action === "box-zoom" && boolPlot);
      const bBoxZoomY = normalPlot && action === "box-zoom-y";
      const bPan = mapPlot || action === "pan" && !boolPlot;
      const bPanX = !mapPlot && action === "pan-x" || action === "pan" && boolPlot;
      const bPanY = !mapPlot && action === "pan-y" && !boolPlot;
      if (bMultiBoxZoom) {
        multiBoxZoom.start(plots, i, event);
      } else if (bBoxZoom) {
        boxZoom.start(plots, i, event);
      } else if (bBoxZoomX) {
        boxZoomX.start(plots, i, event);
      } else if (bBoxZoomY) {
        boxZoomY.start(plots, i, event);
      } else if (bPan) {
        pan.start(plot, event);
      } else if (bPanX) {
        panX.start(plot, event);
      } else if (bPanY) {
        panY.start(plot, event);
      }
    });
    // MARK: mouse down on x axis
    plot.elements.xaxis.addEventListener("mousedown", event => {
      if (global_1.g.state.mode !== "none") {
        return;
      }
      if (event.button !== 0 && event.button !== 1 && event.button !== 2) {
        return;
      }
      // console.log(`mousedown on x axis of plot ${i+1} at x=${computePositionInPlotReference(plot, elt, event).x.toFixed(3)}`);
      const bPanX = global_1.g.config.dragAndDrop.onXAxis === "pan-x";
      if (bPanX) {
        panX.start(plot, event);
      }
    });
    // MARK: mouse down on y axis
    plot.elements.yaxis.addEventListener("mousedown", event => {
      if (global_1.g.state.mode !== "none") {
        return;
      }
      if (event.button !== 0 && event.button !== 1 && event.button !== 2) {
        return;
      }
      // console.log(`mousedown on y axis of plot ${i+1} at y=${computePositionInPlotReference(plot, elt, event).y.toFixed(3)}`);
      const bPanY = global_1.g.config.dragAndDrop.onYAxis === "pan-y" && plots[i].getConfig().mode !== "booleans";
      if (bPanY) {
        panY.start(plot, event);
      }
    });
  });
  // MARK: mouse move
  document.addEventListener("mousemove", event => {
    if (global_1.g.state.mode === "none") {
      return;
    }
    if (global_1.g.state.mode === "pan") {
      pan.update(event);
    } else if (global_1.g.state.mode === "pan-x") {
      panX.update(event);
    } else if (global_1.g.state.mode === "pan-y") {
      panY.update(event);
    } else if (global_1.g.state.mode === "multi-box-zoom") {
      multiBoxZoom.update(event);
    } else if (global_1.g.state.mode === "box-zoom") {
      boxZoom.update(event);
    } else if (global_1.g.state.mode === "box-zoom-x") {
      boxZoomX.update(event);
    } else if (global_1.g.state.mode === "box-zoom-y") {
      boxZoomY.update(event);
    }
  });
  // MARK: mouse up
  document.addEventListener("mouseup", event => {
    if (global_1.g.state.mode === "none") {
      return;
    }
    if (event.button !== global_1.g.state.button) {
      return;
    }
    if (global_1.g.state.mode === "pan") {
      pan.end(event);
    } else if (global_1.g.state.mode === "pan-x") {
      panX.end(event);
    } else if (global_1.g.state.mode === "pan-y") {
      panY.end(event);
    } else if (global_1.g.state.mode === "multi-box-zoom") {
      multiBoxZoom.end(event);
    } else if (global_1.g.state.mode === "box-zoom") {
      boxZoom.end(event);
    } else if (global_1.g.state.mode === "box-zoom-x") {
      boxZoomX.end(event);
    } else if (global_1.g.state.mode === "box-zoom-y") {
      boxZoomY.end(event);
    }
  });
  // MARK: key down
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (global_1.g.state.mode === "box-zoom") {
        boxZoom.cancel();
      } else if (global_1.g.state.mode === "box-zoom-x") {
        boxZoomX.cancel();
      } else if (global_1.g.state.mode === "box-zoom-y") {
        boxZoomY.cancel();
      } else if (global_1.g.state.mode === "multi-box-zoom") {
        multiBoxZoom.cancel();
      }
    }
  });
}

/***/ }),

/***/ "./src/webviews/plots/interactions/index.ts":
/*!**************************************************!*\
  !*** ./src/webviews/plots/interactions/index.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addMapTilesSelector = exports.addWheelEvents = exports.addToolbars = exports.addSettings = exports.addLegend = exports.addDndEvents = exports.addCrosshair = void 0;
var crosshair_1 = __webpack_require__(/*! ./crosshair */ "./src/webviews/plots/interactions/crosshair.ts");
Object.defineProperty(exports, "addCrosshair", ({
  enumerable: true,
  get: function () {
    return crosshair_1.addCrosshair;
  }
}));
var dnd_events_1 = __webpack_require__(/*! ./dnd-events */ "./src/webviews/plots/interactions/dnd-events.ts");
Object.defineProperty(exports, "addDndEvents", ({
  enumerable: true,
  get: function () {
    return dnd_events_1.addDndEvents;
  }
}));
var legend_1 = __webpack_require__(/*! ./legend */ "./src/webviews/plots/interactions/legend.ts");
Object.defineProperty(exports, "addLegend", ({
  enumerable: true,
  get: function () {
    return legend_1.addLegend;
  }
}));
var settings_1 = __webpack_require__(/*! ./settings */ "./src/webviews/plots/interactions/settings.ts");
Object.defineProperty(exports, "addSettings", ({
  enumerable: true,
  get: function () {
    return settings_1.addSettings;
  }
}));
var toolbars_1 = __webpack_require__(/*! ./toolbars */ "./src/webviews/plots/interactions/toolbars.ts");
Object.defineProperty(exports, "addToolbars", ({
  enumerable: true,
  get: function () {
    return toolbars_1.addToolbars;
  }
}));
var wheel_events_1 = __webpack_require__(/*! ./wheel-events */ "./src/webviews/plots/interactions/wheel-events.ts");
Object.defineProperty(exports, "addWheelEvents", ({
  enumerable: true,
  get: function () {
    return wheel_events_1.addWheelEvents;
  }
}));
var map_tiles_selector_1 = __webpack_require__(/*! ./map-tiles-selector */ "./src/webviews/plots/interactions/map-tiles-selector.ts");
Object.defineProperty(exports, "addMapTilesSelector", ({
  enumerable: true,
  get: function () {
    return map_tiles_selector_1.addMapTilesSelector;
  }
}));

/***/ }),

/***/ "./src/webviews/plots/interactions/legend.ts":
/*!***************************************************!*\
  !*** ./src/webviews/plots/interactions/legend.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addLegend = addLegend;
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
const callbacks = [];
function addLegend(plots, dataTransformer) {
  plots.forEach(plot => {
    const plotMode = plot.getConfig().mode;
    // create the legend items
    for (const curve of plot.getCurves()) {
      const legendItem = createLegendItem(curve, plot, dataTransformer);
      plot.elements.interactibles.customLegend.appendChild(legendItem.element);
      if (plotMode !== "map") {
        callbacks.push(legendItem.setValueAt);
      }
    }
    // update the legend items on mouse events
    plot.elements.frame.addEventListener("mouseover", event => {
      if (plotMode == "map") {
        return;
      }
      const x = (0, utils_1.computePositionInPlotReference)(plot, event).x;
      for (const cb of callbacks) {
        cb(x);
      }
    });
    plot.elements.frame.addEventListener("mousemove", event => {
      if (plotMode == "map") {
        return;
      }
      const x = (0, utils_1.computePositionInPlotReference)(plot, event).x;
      for (const cb of callbacks) {
        cb(x);
      }
    });
    plot.elements.frame.addEventListener("mouseout", event => {
      if (plotMode == "map") {
        return;
      }
      for (const cb of callbacks) {
        cb(null);
      }
    });
  });
}
function createLegendItem(curve, plot, dataTransformer) {
  const plotMode = plot.getConfig().mode;
  const legendItem = (0, utils_1.copyTemplate)("legend-item");
  const span1 = legendItem.querySelector("span.my-legend-paramname");
  const span2 = legendItem.querySelector("span.my-legend-paramvalue");
  const onClick = () => {
    const visible = curve.config.disabled === true;
    curve.config.disabled = !visible;
    span1.style.opacity = visible ? "1" : "0.25";
    span2.style.opacity = visible ? "1" : "0.25";
    curve.line.visible = visible;
    if (curve.line2 != undefined) {
      curve.line2.visible = visible;
    }
    plot.updatePointsVisibility();
  };
  span1.addEventListener("click", onClick);
  span2.addEventListener("click", onClick);
  span1.textContent = plotMode !== "map" ? curve.config.legendLabel ?? curve.config.paramName : `${curve.config.paramName} / ${curve.config.paramNameLon ?? "??"}`;
  span1.style.color = curve.config.lineColor;
  span2.style.color = curve.config.lineColor;
  span1.style.opacity = curve.config.disabled === true ? "0.25" : "1";
  span2.style.opacity = curve.config.disabled === true ? "0.25" : "1";
  const setValueAt = t => {
    if (t == null) {
      span2.textContent = "";
      return;
    }
    const y = dataTransformer.getPreviousYValueAt(curve.config.paramName, t);
    span2.textContent = y == null ? "" : plotMode === "normal" ? ` = ${y.toFixed(curve.config.nbDigits ?? 2)}` : ` = ${y}`;
  };
  return {
    element: legendItem,
    setValueAt
  };
}

/***/ }),

/***/ "./src/webviews/plots/interactions/map-tiles-selector.ts":
/*!***************************************************************!*\
  !*** ./src/webviews/plots/interactions/map-tiles-selector.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addMapTilesSelector = addMapTilesSelector;
exports.setAttribution = setAttribution;
exports.createMapTilesRenderer = createMapTilesRenderer;
const Bokeh = __webpack_require__(/*! @bokeh/bokehjs */ "@bokeh/bokehjs");
const plots_1 = __webpack_require__(/*! ../plots */ "./src/webviews/plots/plots/index.ts");
// MARK: add map tiles selector
function addMapTilesSelector(plots) {
  plots.forEach(plot => {
    if (plot.getConfig().mode !== "map") {
      return;
    }
    const style = document.createElement("style");
    style.textContent = styleTextContent;
    plot.elements.frame.shadowRoot?.appendChild(style);
    plot.elements.interactibles.mapTilesSelector.element.style.display = "block";
    plot.elements.interactibles.mapTilesSelector.radios.forEach((radio, i) => {
      const mapTiles = plot.getConfig().mapTiles ?? plots_1.defaultMapTiles;
      if (mapTiles === radio.value) {
        radio.input.checked = true;
      }
      radio.input.addEventListener("change", event => {
        replaceMapTilesRenderer(plot, radio.value);
      });
    });
  });
}
// MARK: callback
function replaceMapTilesRenderer(plot, mapTiles) {
  if (plot.getConfig().mode !== "map") {
    return;
  }
  const fig = plot.getBokehFigure();
  fig.renderers = [createMapTilesRenderer(mapTiles), ...fig.renderers.slice(1)];
  setAttribution(plot, mapTiles);
}
// MARK: get attribution html
function setAttribution(plot, mapTiles) {
  plot.elements.interactibles.mapTilesAttribution.style.display = "block";
  const attrib = getAttributionHtml(mapTiles);
  plot.elements.interactibles.mapTilesAttribution.innerHTML = attrib ?? "";
  plot.elements.interactibles.mapTilesAttribution.style.display = attrib != null ? "block" : "none";
}
function getAttributionHtml(mapTiles) {
  if (mapTiles === "OpenStreetMap.Mapnik") {
    return '&copy; <a href="https://www.openstreetmap.org/copyright" style="text-decoration: none; color: #0078A8">OpenStreetMap</a> contributors';
  } else if (mapTiles === "OpenStreetMap.France") {
    return '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright" style="text-decoration: none; color: #0078A8">OpenStreetMap</a> contributors';
  } else if (mapTiles === "Esri.WorldImagery") {
    return "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";
  } else {
    return null;
  }
}
// MARK: create map tiles renderer
function createMapTilesRenderer(mapTiles) {
  return new Bokeh.TileRenderer({
    tile_source: new Bokeh.WMTSTileSource({
      url: computeMapTilesUrl(mapTiles)
    })
  });
}
function computeMapTilesUrl(mapTiles) {
  if (mapTiles === "OpenStreetMap.Mapnik") {
    return "https://tile.openstreetmap.org/{Z}/{X}/{Y}.png";
  }
  if (mapTiles === "OpenStreetMap.France") {
    return "https://c.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";
  }
  if (mapTiles === "Esri.WorldImagery") {
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  }
  return "";
}
// MARK: helpers
const styleTextContent = `
.my-map-tiles-selector {
	border: 2px solid rgba(0,0,0,0.2);
	border-radius: 5px;
	background-clip: padding-box;
	margin: 0;
	background-color: white;
	z-index: 999;
	display: none;
	position: absolute;
	top: 6px;
	left: 6px;
}
.my-map-tiles-selector-button {
	width: 33px;
	height: 33px;
	display: block;
	margin: 0;
	padding: 0;
	cursor: pointer;
	background-position: 50% 50%;
	background-repeat: no-repeat;
	background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAQAAAADQ4RFAAACf0lEQVR4AY1UM3gkARTePdvdoTxXKc+qTl3aU5U6b2Kbkz3Gtq3Zw6ziLGNPzrYx7946Tr6/ee/XeCQ4D3ykPtL5tHno4n0d/h3+xfuWHGLX81cn7r0iTNzjr7LrlxCqPtkbTQEHeqOrTy4Yyt3VCi/IOB0v7rVC7q45Q3Gr5K6jt+3Gl5nCoDD4MtO+j96Wu8atmhGqcNGHObuf8OM/x3AMx38+4Z2sPqzCxRFK2aF2e5Jol56XTLyggAMTL56XOMoS1W4pOyjUcGGQdZxU6qRh7B9Zp+PfpOFlqt0zyDZckPi1ttmIp03jX8gyJ8a/PG2yutpS/Vol7peZIbZcKBAEEheEIAgFbDkz5H6Zrkm2hVWGiXKiF4Ycw0RWKdtC16Q7qe3X4iOMxruonzegJzWaXFrU9utOSsLUmrc0YjeWYjCW4PDMADElpJSSQ0vQvA1Tm6/JlKnqFs1EGyZiFCqnRZTEJJJiKRYzVYzJck2Rm6P4iH+cmSY0YzimYa8l0EtTODFWhcMIMVqdsI2uiTvKmTisIDHJ3od5GILVhBCarCfVRmo4uTjkhrhzkiBV7SsaqS+TzrzM1qpGGUFt28pIySQHR6h7F6KSwGWm97ay+Z+ZqMcEjEWebE7wxCSQwpkhJqoZA5ivCdZDjJepuJ9IQjGGUmuXJdBFUygxVqVsxFsLMbDe8ZbDYVCGKxs+W080max1hFCarCfV+C1KATwcnvE9gRRuMP2prdbWGowm1KB1y+zwMMENkM755cJ2yPDtqhTI6ED1M/82yIDtC/4j4BijjeObflpO9I9MwXTCsSX8jWAFeHr05WoLTJ5G8IQVS/7vwR6ohirYM7f6HzYpogfS3R2OAAAAAElFTkSuQmCC");
	background-size: 75% 75%;
}
.my-map-tiles-selector-menu {
	box-sizing: border-box;
	margin: 0;
	padding: 2px 4px 2px 0;
	cursor: pointer;
	display: none;
	user-select: none;
	color: black;
}
.my-map-tiles-selector-menu > label {
	cursor: pointer;
	display: block;
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	line-height: 1.5;
}
.my-map-tiles-selector-menu > span {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	line-height: 1.5;
}
.my-map-tiles-selector-menu span {
	cursor: pointer;
}
.my-map-tiles-selector-menu input {
	cursor: pointer;
	margin-top: 2px;
	width: 12px;
	height: 12px;
	position: relative;
	top: 1px;
}
.my-map-tiles-selector:hover .my-map-tiles-selector-button {
	display: none;
}
.my-map-tiles-selector:hover .my-map-tiles-selector-menu {
	display: block;
}
`;

/***/ }),

/***/ "./src/webviews/plots/interactions/settings.ts":
/*!*****************************************************!*\
  !*** ./src/webviews/plots/interactions/settings.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addSettings = addSettings;
const global_1 = __webpack_require__(/*! ../global */ "./src/webviews/plots/global.ts");
const e = {
  dialog: document.querySelector("#settings-dialog"),
  form: document.querySelector("#settings-form"),
  dragAndDrop: {
    limitInView: document.querySelector("#dnd-limit-in-view"),
    onXAxis: document.querySelector("#dnd-on-x-axis"),
    onYAxis: document.querySelector("#dnd-on-y-axis"),
    onFrameWithLeftButton: document.querySelector("#dnd-on-central-part-left-button"),
    onFrameWithMiddleButton: document.querySelector("#dnd-on-central-part-middle-button"),
    onFrameWithRightButton: document.querySelector("#dnd-on-central-part-right-button"),
    adjustYRangeAfterBoxZoom: document.querySelector("#dnd-adjust-y-range-on-box-zoom"),
    adjustYRangeAfterXZoom: document.querySelector("#dnd-adjust-y-range-on-x-zoom")
  },
  wheelEvents: {
    onXAxis: document.querySelector("#wheel-on-x-axis"),
    onYAxis: document.querySelector("#wheel-on-y-axis"),
    onFrame: document.querySelector("#wheel-on-central-part")
  },
  toolbars: {
    translationFactorX: document.querySelector("#toolbars-translation-factor-x"),
    translationFactorY: document.querySelector("#toolbars-translation-factor-y"),
    zoomFactorX: document.querySelector("#toolbars-zoom-factor-x"),
    zoomFactorY: document.querySelector("#toolbars-zoom-factor-y"),
    marginFactorX: document.querySelector("#toolbars-margin-factor-x"),
    marginFactorY: document.querySelector("#toolbars-margin-factor-y")
  },
  map: {
    displayMode: document.querySelector("#map-display-mode"),
    transparencyCoefficient: document.querySelector("#map-transparency-coefficient")
  },
  buttons: {
    open: document.querySelector("#settings-button-open"),
    save: document.querySelector("#settings-button-save"),
    cancel: document.querySelector("#settings-button-cancel")
  }
};
function computeTimeRange(plots) {
  const plot = plots.find(p => {
    const config = p.getConfig();
    return config.mode === "normal" || config.mode === "booleans";
  });
  return plot?.getXRange() ?? {
    start: -Infinity,
    end: Infinity
  };
}
function addSettings(plots) {
  e.buttons.open.addEventListener("click", event => {
    e.dragAndDrop.limitInView.checked = global_1.g.config.dragAndDrop.limitInView;
    e.dragAndDrop.onXAxis.value = global_1.g.config.dragAndDrop.onXAxis;
    e.dragAndDrop.onYAxis.value = global_1.g.config.dragAndDrop.onYAxis;
    e.dragAndDrop.onFrameWithLeftButton.value = global_1.g.config.dragAndDrop.onFrameWithLeftButton;
    e.dragAndDrop.onFrameWithMiddleButton.value = global_1.g.config.dragAndDrop.onFrameWithMiddleButton;
    e.dragAndDrop.onFrameWithRightButton.value = global_1.g.config.dragAndDrop.onFrameWithRightButton;
    e.dragAndDrop.adjustYRangeAfterBoxZoom.value = global_1.g.config.dragAndDrop.adjustYRangeAfterBoxZoom;
    e.dragAndDrop.adjustYRangeAfterXZoom.value = global_1.g.config.dragAndDrop.adjustYRangeAfterXZoom;
    e.wheelEvents.onXAxis.value = global_1.g.config.wheelEvents.onXAxis;
    e.wheelEvents.onYAxis.value = global_1.g.config.wheelEvents.onYAxis;
    e.wheelEvents.onFrame.value = global_1.g.config.wheelEvents.onFrame;
    e.toolbars.translationFactorX.valueAsNumber = global_1.g.config.toolbars.translationFactorX;
    e.toolbars.translationFactorY.valueAsNumber = global_1.g.config.toolbars.translationFactorY;
    e.toolbars.zoomFactorX.valueAsNumber = global_1.g.config.toolbars.zoomFactorX;
    e.toolbars.zoomFactorY.valueAsNumber = global_1.g.config.toolbars.zoomFactorY;
    e.toolbars.marginFactorX.valueAsNumber = global_1.g.config.toolbars.marginFactorX;
    e.toolbars.marginFactorY.valueAsNumber = global_1.g.config.toolbars.marginFactorY;
    e.map.displayMode.value = global_1.g.config.map.displayMode;
    e.map.transparencyCoefficient.valueAsNumber = global_1.g.config.map.transparencyCoefficient;
    e.dialog.showModal();
  });
  e.buttons.save.addEventListener("click", event => {
    if (!e.form.checkValidity()) {
      e.form.reportValidity();
      return;
    }
    global_1.g.config.dragAndDrop.limitInView = e.dragAndDrop.limitInView.checked;
    global_1.g.config.dragAndDrop.onXAxis = e.dragAndDrop.onXAxis.value;
    global_1.g.config.dragAndDrop.onYAxis = e.dragAndDrop.onYAxis.value;
    global_1.g.config.dragAndDrop.onFrameWithLeftButton = e.dragAndDrop.onFrameWithLeftButton.value;
    global_1.g.config.dragAndDrop.onFrameWithMiddleButton = e.dragAndDrop.onFrameWithMiddleButton.value;
    global_1.g.config.dragAndDrop.onFrameWithRightButton = e.dragAndDrop.onFrameWithRightButton.value;
    global_1.g.config.dragAndDrop.adjustYRangeAfterBoxZoom = e.dragAndDrop.adjustYRangeAfterBoxZoom.value;
    global_1.g.config.dragAndDrop.adjustYRangeAfterXZoom = e.dragAndDrop.adjustYRangeAfterXZoom.value;
    global_1.g.config.wheelEvents.onXAxis = e.wheelEvents.onXAxis.value;
    global_1.g.config.wheelEvents.onYAxis = e.wheelEvents.onYAxis.value;
    global_1.g.config.wheelEvents.onFrame = e.wheelEvents.onFrame.value;
    global_1.g.config.toolbars.translationFactorX = e.toolbars.translationFactorX.valueAsNumber;
    global_1.g.config.toolbars.translationFactorY = e.toolbars.translationFactorY.valueAsNumber;
    global_1.g.config.toolbars.zoomFactorX = e.toolbars.zoomFactorX.valueAsNumber;
    global_1.g.config.toolbars.zoomFactorY = e.toolbars.zoomFactorY.valueAsNumber;
    global_1.g.config.toolbars.marginFactorX = e.toolbars.marginFactorX.valueAsNumber;
    global_1.g.config.toolbars.marginFactorY = e.toolbars.marginFactorY.valueAsNumber;
    global_1.g.config.map.displayMode = e.map.displayMode.value;
    global_1.g.config.map.transparencyCoefficient = e.map.transparencyCoefficient.valueAsNumber;
    (0, global_1.writeConfigToLocalStorage)();
    const timeRange = computeTimeRange(plots);
    for (const plot of plots) {
      plot.updateTrajectories(timeRange.start, timeRange.end);
    }
    e.dialog.close();
  });
  e.buttons.cancel.addEventListener("click", event => {
    e.dialog.close();
  });
  e.dialog.addEventListener("click", event => {
    if (event.target === e.dialog) {
      // if click outside the dialog (the container mask the dialog padding to avoid that clicking on it closes the dialog)
      e.dialog.close();
    }
  });
}

/***/ }),

/***/ "./src/webviews/plots/interactions/toolbars.ts":
/*!*****************************************************!*\
  !*** ./src/webviews/plots/interactions/toolbars.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addToolbars = addToolbars;
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
const global_1 = __webpack_require__(/*! ../global */ "./src/webviews/plots/global.ts");
const gct = global_1.g.config.toolbars;
// MARK: add toolbars
function addToolbars(plots) {
  plots.forEach(plot => {
    if (plot.getConfig().mode === "map") {
      return;
    }
    // add x axis toolbar
    const xAxisToolbar = (0, utils_1.copyTemplate)("xaxis-toolbar");
    plot.elements.xaxis.shadowRoot?.appendChild(xAxisToolbar);
    const styleX = document.createElement("style");
    styleX.textContent = styleTextContent;
    plot.elements.xaxis.shadowRoot?.appendChild(styleX);
    xAxisToolbar.querySelector("#button-move-left")?.addEventListener("click", () => {
      moveLeft(plot);
    });
    xAxisToolbar.querySelector("#button-move-right")?.addEventListener("click", () => {
      moveRight(plot);
    });
    xAxisToolbar.querySelector("#button-zoom-in")?.addEventListener("click", () => {
      zoomInX(plot);
    });
    xAxisToolbar.querySelector("#button-zoom-out")?.addEventListener("click", () => {
      zoomOutX(plot);
    });
    xAxisToolbar.querySelector("#button-fit-content")?.addEventListener("click", () => {
      fitContentX(plot, plots);
    });
    if (plot.getConfig().mode === "normal") {
      // add y axis toolbar
      const yAxisToolbar = (0, utils_1.copyTemplate)("yaxis-toolbar");
      plot.elements.yaxis.shadowRoot?.appendChild(yAxisToolbar);
      const styleY = document.createElement("style");
      styleY.textContent = styleTextContent;
      plot.elements.yaxis.shadowRoot?.appendChild(styleY);
      yAxisToolbar.querySelector("#button-zoom-in")?.addEventListener("click", () => {
        zoomInY(plot);
      });
      yAxisToolbar.querySelector("#button-zoom-out")?.addEventListener("click", () => {
        zoomOutY(plot);
      });
      yAxisToolbar.querySelector("#button-fit-content")?.addEventListener("click", () => {
        plot.fitContentY();
      });
    }
  });
}
// MARK: tool buttons callbacks
function moveLeft(p) {
  const x_range = p.getXRange();
  const offset = gct.translationFactorX * (x_range.end - x_range.start);
  p.setXRange(x_range.start - offset, x_range.end - offset);
}
function moveRight(p) {
  const x_range = p.getXRange();
  const offset = gct.translationFactorX * (x_range.end - x_range.start);
  p.setXRange(x_range.start + offset, x_range.end + offset);
}
function zoomInX(p) {
  const x_range = p.getXRange();
  const offset = 0.5 * (1 - 1 / gct.zoomFactorX) * (x_range.end - x_range.start);
  p.setXRange(x_range.start + offset, x_range.end - offset);
}
function zoomOutX(p) {
  const x_range = p.getXRange();
  const offset = 0.5 * (gct.zoomFactorX - 1) * (x_range.end - x_range.start);
  p.setXRange(x_range.start - offset, x_range.end + offset);
}
function fitContentX(p, plots) {
  p.resetXRange();
  plots.forEach(p => {
    if (p.getConfig().mode !== "map") {
      p.resetYRange();
    }
  });
}
function zoomInY(p) {
  const y_range = p.getYRange();
  const offset = 0.5 * (1 - 1 / gct.zoomFactorY) * (y_range.end - y_range.start);
  p.setYRange(y_range.start + offset, y_range.end - offset);
}
function zoomOutY(p) {
  const y_range = p.getYRange();
  const offset = 0.5 * (gct.zoomFactorY - 1) * (y_range.end - y_range.start);
  p.setYRange(y_range.start - offset, y_range.end + offset);
}
// MARK: helpers
const styleTextContent = `
:host(:hover) .my-toolbar {
	display: flex;
}
.my-toolbar {
	position: absolute;
	z-index: 999999;
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	width: fit-content;
	height: fit-content;
	display: none;
	color: #5f6b7c;
}
.my-toolbar.horizontal {
	flex-direction: row;
	left: 0;
	top: 0;
}
.my-toolbar.vertical {
	flex-direction: column;
	bottom: -1px;
	right: -1px;
}
.my-toolbar button {
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 0;
	width: 22px;
	height: 22px;
	background: #ffffff;
	cursor: pointer;
	border: 1px solid black;
	padding: 4px 1px;
}
.my-toolbar.horizontal button:not(:first-child) {
	border-left: none;
}
.my-toolbar.vertical button:not(:first-child) {
	border-top: none;
}
.my-toolbar button:hover {
	background: #e5e8eb;
	color: #404854;
}
`;

/***/ }),

/***/ "./src/webviews/plots/interactions/wheel-events.ts":
/*!*********************************************************!*\
  !*** ./src/webviews/plots/interactions/wheel-events.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addWheelEvents = addWheelEvents;
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
const global_1 = __webpack_require__(/*! ../global */ "./src/webviews/plots/global.ts");
function addWheelEvents(plots) {
  plots.forEach(plot => {
    // MARK: on frame
    plot.elements.frame.addEventListener("wheel", event => {
      event.preventDefault();
      if (global_1.g.state.mode !== "none") {
        return;
      }
      // console.log(`wheel on frame of plot ${i+1} at x=${x0.toFixed(3)}, y=${y0.toFixed(3)}, delta=${delta}`);
      const action = global_1.g.config.wheelEvents.onFrame;
      const plotConfig = plot.getConfig();
      const boolPlot = plotConfig.mode === "booleans";
      const mapPlot = plotConfig.mode === "map";
      const bZoomXY = mapPlot || action === "zoom" && !boolPlot;
      const bZoomX = !mapPlot && action === "zoom-x" || action === "zoom" && boolPlot;
      const bZoomY = !mapPlot && action === "zoom-y" && !boolPlot;
      const bPanX = !mapPlot && action === "pan-x";
      const bPanY = !mapPlot && action === "pan-y" && !boolPlot;
      if (bZoomXY) {
        zoomXY(plot, event);
      } else if (bZoomX) {
        zoomX(plot, event);
      } else if (bZoomY) {
        zoomY(plot, event);
      } else if (bPanX) {
        panX(plot, event);
      } else if (bPanY) {
        panY(plot, event);
      }
    });
    // MARK: on x axis
    plot.elements.xaxis.addEventListener("wheel", event => {
      event.preventDefault();
      if (global_1.g.state.mode !== "none") {
        return;
      }
      // console.log(`wheel on x axis of plot ${i+1} at x=${x0.toFixed(3)}, delta=${delta}`);
      const action = global_1.g.config.wheelEvents.onXAxis;
      const mapPlot = plot.getConfig().mode === "map";
      const bZoomX = !mapPlot && action === "zoom-x";
      const bPanX = action === "pan-x";
      if (bZoomX) {
        zoomX(plot, event);
      } else if (bPanX) {
        panX(plot, event);
      }
    });
    // MARK: on y axis
    plot.elements.yaxis.addEventListener("wheel", event => {
      event.preventDefault();
      if (global_1.g.state.mode !== "none") {
        return;
      }
      // console.log(`wheel on y axis of plot ${i+1} at y=${y0.toFixed(3)}, delta=${delta}`);
      const action = global_1.g.config.wheelEvents.onYAxis;
      const plotConfig = plot.getConfig();
      const boolPlot = plotConfig.mode === "booleans";
      const normalPlot = plotConfig.mode === "normal";
      const bZoomY = normalPlot && action === "zoom-y";
      const bPanY = !boolPlot && action === "pan-y";
      if (bZoomY) {
        zoomY(plot, event);
      } else if (bPanY) {
        panY(plot, event);
      }
    });
  });
}
// MARK: functions
function zoomXY(plot, event) {
  const delta = event.deltaY;
  if (Math.abs(delta) < 1) {
    return;
  }
  const {
    x: x0,
    y: y0
  } = (0, utils_1.computePositionInPlotReference)(plot, event);
  const ax = global_1.g.config.wheelEvents.deltaToZoomFactorX(delta);
  const ay = global_1.g.config.wheelEvents.deltaToZoomFactorY(delta);
  const bx = x0 * (1 - ax);
  const by = y0 * (1 - ay);
  const xRange = plot.getXRange();
  const yRange = plot.getYRange();
  plot.setXRange(ax * xRange.start + bx, ax * xRange.end + bx);
  plot.setYRange(ay * yRange.start + by, ay * yRange.end + by);
}
function zoomX(plot, event) {
  const delta = event.deltaY;
  if (Math.abs(delta) < 1) {
    return;
  }
  const x0 = (0, utils_1.computePositionInPlotReference)(plot, event).x;
  const a = global_1.g.config.wheelEvents.deltaToZoomFactorX(delta);
  const b = x0 * (1 - a);
  const xRange = plot.getXRange();
  plot.setXRange(a * xRange.start + b, a * xRange.end + b);
}
function zoomY(plot, event) {
  const delta = event.deltaY;
  if (Math.abs(delta) < 1) {
    return;
  }
  const y0 = (0, utils_1.computePositionInPlotReference)(plot, event).y;
  const a = global_1.g.config.wheelEvents.deltaToZoomFactorY(delta);
  const b = y0 * (1 - a);
  const yRange = plot.getYRange();
  plot.setYRange(a * yRange.start + b, a * yRange.end + b);
}
function panX(plot, event) {
  const delta = event.deltaY;
  if (Math.abs(delta) < 1) {
    return;
  }
  const xRange = plot.getXRange();
  const offset = global_1.g.config.wheelEvents.deltaToTranslationFactorX(delta) * (xRange.end - xRange.start);
  plot.setXRange(xRange.start + offset, xRange.end + offset);
}
function panY(plot, event) {
  const delta = event.deltaY;
  if (Math.abs(delta) < 1) {
    return;
  }
  const yRange = plot.getYRange();
  const offset = global_1.g.config.wheelEvents.deltaToTranslationFactorY(delta) * (yRange.end - yRange.start);
  plot.setYRange(yRange.start + offset, yRange.end + offset);
}

/***/ }),

/***/ "./src/webviews/plots/plots/defaults.ts":
/*!**********************************************!*\
  !*** ./src/webviews/plots/plots/defaults.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.defaultMapTiles = exports.defaultInterpolation = exports.defaultIfParamNotFound = void 0;
exports.defaultIfParamNotFound = "show-in-legend";
exports.defaultInterpolation = "linear";
exports.defaultMapTiles = "OpenStreetMap.Mapnik";

/***/ }),

/***/ "./src/webviews/plots/plots/index.ts":
/*!*******************************************!*\
  !*** ./src/webviews/plots/plots/index.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.defaultMapTiles = exports.defaultInterpolation = exports.defaultIfParamNotFound = exports.PlotMap = exports.PlotBooleans = exports.PlotNormal = exports.Plot = void 0;
var plot_1 = __webpack_require__(/*! ./plot */ "./src/webviews/plots/plots/plot.ts");
Object.defineProperty(exports, "Plot", ({
  enumerable: true,
  get: function () {
    return plot_1.Plot;
  }
}));
var plot_normal_1 = __webpack_require__(/*! ./plot-normal */ "./src/webviews/plots/plots/plot-normal.ts");
Object.defineProperty(exports, "PlotNormal", ({
  enumerable: true,
  get: function () {
    return plot_normal_1.PlotNormal;
  }
}));
var plot_booleans_1 = __webpack_require__(/*! ./plot-booleans */ "./src/webviews/plots/plots/plot-booleans.ts");
Object.defineProperty(exports, "PlotBooleans", ({
  enumerable: true,
  get: function () {
    return plot_booleans_1.PlotBooleans;
  }
}));
var plot_map_1 = __webpack_require__(/*! ./plot-map */ "./src/webviews/plots/plots/plot-map.ts");
Object.defineProperty(exports, "PlotMap", ({
  enumerable: true,
  get: function () {
    return plot_map_1.PlotMap;
  }
}));
var defaults_1 = __webpack_require__(/*! ./defaults */ "./src/webviews/plots/plots/defaults.ts");
Object.defineProperty(exports, "defaultIfParamNotFound", ({
  enumerable: true,
  get: function () {
    return defaults_1.defaultIfParamNotFound;
  }
}));
Object.defineProperty(exports, "defaultInterpolation", ({
  enumerable: true,
  get: function () {
    return defaults_1.defaultInterpolation;
  }
}));
Object.defineProperty(exports, "defaultMapTiles", ({
  enumerable: true,
  get: function () {
    return defaults_1.defaultMapTiles;
  }
}));

/***/ }),

/***/ "./src/webviews/plots/plots/plot-booleans.ts":
/*!***************************************************!*\
  !*** ./src/webviews/plots/plots/plot-booleans.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.PlotBooleans = void 0;
const Bokeh = __webpack_require__(/*! @bokeh/bokehjs */ "@bokeh/bokehjs");
const plot_1 = __webpack_require__(/*! ./plot */ "./src/webviews/plots/plots/plot.ts");
const defaults_1 = __webpack_require__(/*! ./defaults */ "./src/webviews/plots/plots/defaults.ts");
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
const global_1 = __webpack_require__(/*! ../global */ "./src/webviews/plots/global.ts");
class PlotBooleans extends plot_1.Plot {
  constructor(props) {
    super(props);
    if (props.config.mode !== "booleans") {
      throw new Error("Error 2");
    }
    this.fig = new Bokeh.Plotting.Figure({
      tools: "",
      sizing_mode: "stretch_both",
      x_range: props.x_range,
      y_range: new Bokeh.Range1d(),
      x_axis_type: "linear",
      y_axis_type: "linear"
    });
    this.fig.legend.visible = false;
    this.fig.toolbar.logo = null;
    this.dataXRange = {
      min: NaN,
      max: NaN
    };
    let i = 0;
    this.curves = this.config.curves.map(c => {
      const cds = this.dataTransformer.toColumnDataSourceBoolean(c.paramName, i, c.ifParamNotFound);
      if (cds != null) {
        i++;
      }
      c.interpolation = c.interpolation ?? this.config.interpolation ?? defaults_1.defaultInterpolation;
      return {
        config: c,
        dataSource: cds
      };
    }).filter(c => c.dataSource != null).map(c => ({
      config: c.config,
      dataSource: c.dataSource,
      // @ts-ignore
      dt: c.dataSource.data["x"][1] - c.dataSource.data["x"][0],
      line: this.createLine(c.config, c.dataSource),
      points: this.createPoints(c.config, c.dataSource)
    }));
    this.fig.yaxis.ticker = new Bokeh.FixedTicker({
      ticks: Array.from({
        length: this.config.curves.length
      }, (_, i) => -i),
      minor_ticks: []
    });
    this.fig.ygrid.ticker = new Bokeh.FixedTicker({
      ticks: Array.from({
        length: this.config.curves.length
      }, (_, i) => -i),
      minor_ticks: []
    });
    this.fig.yaxis.major_label_overrides = new Map(Array.from({
      length: this.config.curves.length
    }, (_, i) => i).map(i => [-i, this.config.curves[i].legendLabel ?? this.config.curves[i].paramName]));
    this.computeDataRange();
  }
  computeDataRange() {
    this.dataXRange = this.curves
    // @ts-ignore
    .map(curve => (0, utils_1.minmax)(curve.dataSource.data["x"])).reduce((acc, v) => ({
      min: Math.min(acc.min, v.min),
      max: Math.max(acc.max, v.max)
    }), {
      min: Infinity,
      max: -Infinity
    });
    if (!Number.isFinite(this.dataXRange.min) || !Number.isFinite(this.dataXRange.max)) {
      this.fig.visible = false;
    }
  }
  resetXRange() {
    // console.log(`resetXRange (${this.dataXRange.min} - ${this.dataXRange.max})`);
    if (Number.isNaN(this.dataXRange.min) || Number.isNaN(this.dataXRange.max)) {
      return false;
    }
    const newRange = (0, utils_1.addMargin)({
      start: this.dataXRange.min,
      end: this.dataXRange.max
    }, global_1.g.config.toolbars.marginFactorX);
    this.setXRange(newRange.start, newRange.end);
    return true;
  }
  resetYRange() {
    this.setYRange(1 - this.config.curves.length - 0.3, 1);
    return true;
  }
  fitContentY() {
    this.resetYRange();
  }
  getCurves() {
    return this.curves;
  }
  updatePointsVisibility() {
    const xSpan = this.fig.x_range.end - this.fig.x_range.start;
    this.curves.forEach(c => {
      c.points.visible = xSpan / c.dt < 50 && c.line.visible;
    });
  }
  updateTrajectories(t1, t2) {}
}
exports.PlotBooleans = PlotBooleans;

/***/ }),

/***/ "./src/webviews/plots/plots/plot-map.ts":
/*!**********************************************!*\
  !*** ./src/webviews/plots/plots/plot-map.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.PlotMap = void 0;
const Bokeh = __webpack_require__(/*! @bokeh/bokehjs */ "@bokeh/bokehjs");
const plot_1 = __webpack_require__(/*! ./plot */ "./src/webviews/plots/plots/plot.ts");
const defaults_1 = __webpack_require__(/*! ./defaults */ "./src/webviews/plots/plots/defaults.ts");
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
const map_tiles_selector_1 = __webpack_require__(/*! ../interactions/map-tiles-selector */ "./src/webviews/plots/interactions/map-tiles-selector.ts");
const global_1 = __webpack_require__(/*! ../global */ "./src/webviews/plots/global.ts");
class PlotMap extends plot_1.Plot {
  constructor(props) {
    super(props);
    if (props.config.mode !== "map") {
      throw new Error("Error 3");
    }
    this.fig = new Bokeh.Plotting.Figure({
      tools: "",
      sizing_mode: "stretch_both",
      x_range: new Bokeh.Range1d({
        start: -4000000,
        end: 4000000
      }),
      y_range: new Bokeh.Range1d({
        start: -6000000,
        end: 10000000
      }),
      x_axis_type: "mercator",
      y_axis_type: "mercator"
    });
    this.fig.legend.visible = false;
    this.fig.toolbar.logo = null;
    this.fig.renderers.push((0, map_tiles_selector_1.createMapTilesRenderer)(this.config.mapTiles ?? defaults_1.defaultMapTiles));
    this.curves = this.config.curves.map(c => {
      c.interpolation = c.interpolation ?? this.config.interpolation ?? defaults_1.defaultInterpolation;
      const cds = this.dataTransformer.toColumnDataSourceMap(c.paramName, c.paramNameLon ?? "", "auto", c.interpolation, c.ifParamNotFound);
      if (cds != null) {
        // @ts-ignore
        cds.data["x2"] = cds.data["x"];
        // @ts-ignore
        cds.data["y2"] = cds.data["y"];
      }
      return {
        config: c,
        dataSource: cds
      };
    }).filter(c => c.dataSource != null).map(c => ({
      config: c.config,
      dataSource: c.dataSource,
      dt: NaN,
      line2: this.createLine2({
        ...c.config,
        lineAlpha: global_1.g.config.map.transparencyCoefficient * (c.config.lineAlpha ?? 1)
      }, c.dataSource),
      line: this.createLine(c.config, c.dataSource),
      points: this.createPoints(c.config, c.dataSource)
    }));
    // this.fig.xaxis.axis_label_text_font_style = "normal";
    // this.fig.xaxis.axis_label_text_font_size = "14px";
    // this.fig.xaxis.axis_label = "Longitude (°)";
    // this.fig.yaxis.axis_label_text_font_style = "normal";
    // this.fig.yaxis.axis_label_text_font_size = "14px";
    // this.fig.yaxis.axis_label = "Latitude (°)";
    this.fig.xgrid.visible = false;
    this.fig.ygrid.visible = false;
    this.computeDataRange();
  }
  computeDataRange() {
    this.curves.forEach(curve => {
      // @ts-ignore
      curve.xrange = (0, utils_1.minmax)(curve.dataSource.data["x"]);
      // @ts-ignore
      curve.yrange = (0, utils_1.minmax)(curve.dataSource.data["y"]);
    });
  }
  resetXRange() {
    const xRange = this.curves.filter(c => c.config.disabled !== true).map(c => c.xrange).filter(xr => xr != undefined).reduce((acc, v) => ({
      min: Math.min(acc.min, v.min),
      max: Math.max(acc.max, v.max)
    }), {
      min: Infinity,
      max: -Infinity
    });
    if (!Number.isFinite(xRange.min) || !Number.isFinite(xRange.max)) {
      return false;
    }
    const newRange = (0, utils_1.addMargin)({
      start: xRange.min,
      end: xRange.max
    }, global_1.g.config.toolbars.marginFactorX);
    this.setXRange(newRange.start, newRange.end);
    return true;
  }
  resetYRange() {
    const yRange = this.curves.filter(c => c.config.disabled !== true).map(c => c.yrange).filter(yr => yr != undefined).reduce((acc, v) => ({
      min: Math.min(acc.min, v.min),
      max: Math.max(acc.max, v.max)
    }), {
      min: Infinity,
      max: -Infinity
    });
    if (!Number.isFinite(yRange.min) || !Number.isFinite(yRange.max)) {
      return false;
    }
    const newRange = (0, utils_1.addMargin)({
      start: yRange.min,
      end: yRange.max
    }, global_1.g.config.toolbars.marginFactorY);
    this.setYRange(newRange.start, newRange.end);
    return true;
  }
  fitContentY() {}
  getCurves() {
    return this.curves;
  }
  updatePointsVisibility() {}
  updateTrajectories(t1, t2) {
    for (const c of this.curves) {
      const alpha = c.config.lineAlpha ?? 1;
      if (global_1.g.config.map.displayMode === "full") {
        c.line.glyph.line_alpha = alpha;
        c.line2.glyph.line_alpha = 0;
      } else if (global_1.g.config.map.displayMode === "only-in-timerange") {
        c.line.glyph.line_alpha = 0;
        c.line2.glyph.line_alpha = alpha;
        // add nans
        // @ts-ignore
        const times = c.dataSource.data["t"];
        // @ts-ignore
        c.dataSource.data["y2"] = c.dataSource.data["y"].map((y, i) => {
          const t = times[i];
          return t >= t1 && t <= t2 ? y : NaN;
        });
        c.dataSource.change.emit();
      } else {
        c.line.glyph.line_alpha = global_1.g.config.map.transparencyCoefficient * alpha;
        c.line2.glyph.line_alpha = alpha;
        // add nans
        // @ts-ignore
        const times = c.dataSource.data["t"];
        // @ts-ignore
        c.dataSource.data["y2"] = c.dataSource.data["y"].map((y, i) => {
          const t = times[i];
          return t >= t1 && t <= t2 ? y : NaN;
        });
        c.dataSource.change.emit();
      }
    }
  }
}
exports.PlotMap = PlotMap;

/***/ }),

/***/ "./src/webviews/plots/plots/plot-normal.ts":
/*!*************************************************!*\
  !*** ./src/webviews/plots/plots/plot-normal.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.PlotNormal = void 0;
const Bokeh = __webpack_require__(/*! @bokeh/bokehjs */ "@bokeh/bokehjs");
const plot_1 = __webpack_require__(/*! ./plot */ "./src/webviews/plots/plots/plot.ts");
const defaults_1 = __webpack_require__(/*! ./defaults */ "./src/webviews/plots/plots/defaults.ts");
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
const global_1 = __webpack_require__(/*! ../global */ "./src/webviews/plots/global.ts");
class PlotNormal extends plot_1.Plot {
  constructor(props) {
    super(props);
    if (props.config.mode !== "normal") {
      throw new Error("Error 1");
    }
    this.fig = new Bokeh.Plotting.Figure({
      tools: "",
      sizing_mode: "stretch_both",
      x_range: props.x_range,
      y_range: new Bokeh.Range1d(),
      x_axis_type: "linear",
      y_axis_type: "linear"
    });
    this.fig.legend.visible = false;
    this.fig.toolbar.logo = null;
    this.dataXRange = {
      min: NaN,
      max: NaN
    };
    this.curves = this.config.curves.map(c => {
      const cds = this.dataTransformer.toColumnDataSourceNormal(c.paramName, c.ifParamNotFound);
      c.interpolation = c.interpolation ?? this.config.interpolation ?? defaults_1.defaultInterpolation;
      return {
        config: c,
        dataSource: cds
      };
    }).filter(c => c.dataSource != null).map(c => ({
      config: c.config,
      dataSource: c.dataSource,
      // @ts-ignore
      dt: c.dataSource.data["x"][1] - c.dataSource.data["x"][0],
      line: this.createLine(c.config, c.dataSource),
      points: this.createPoints(c.config, c.dataSource)
    }));
    this.fig.yaxis.axis_label_text_font_style = "normal";
    this.fig.yaxis.axis_label_text_font_size = "14px";
    this.fig.yaxis.axis_label = this.config.yAxisLabel ?? this.config.name;
    this.computeDataRange();
  }
  computeDataRange() {
    this.dataXRange = this.curves
    // @ts-ignore
    .map(curve => (0, utils_1.minmax)(curve.dataSource.data["x"])).reduce((acc, v) => ({
      min: Math.min(acc.min, v.min),
      max: Math.max(acc.max, v.max)
    }), {
      min: Infinity,
      max: -Infinity
    });
    if (!Number.isFinite(this.dataXRange.min) || !Number.isFinite(this.dataXRange.max)) {
      this.fig.visible = false;
    }
    this.curves.forEach(curve => {
      // @ts-ignore
      curve.yrange = (0, utils_1.minmax)(curve.dataSource.data["y"]);
    });
  }
  resetXRange() {
    // console.log(`resetXRange (${this.dataXRange.min} - ${this.dataXRange.max})`);
    if (Number.isNaN(this.dataXRange.min) || Number.isNaN(this.dataXRange.max)) {
      return false;
    }
    const newRange = (0, utils_1.addMargin)({
      start: this.dataXRange.min,
      end: this.dataXRange.max
    }, global_1.g.config.toolbars.marginFactorX);
    this.setXRange(newRange.start, newRange.end);
    return true;
  }
  resetYRange() {
    if (this.config.yAxisRange != undefined) {
      this.setYRange(this.config.yAxisRange[0], this.config.yAxisRange[1]);
      return true;
    }
    const yRange = this.curves.filter(c => c.config.disabled !== true).map(c => c.yrange).filter(yr => yr != undefined).reduce((acc, v) => ({
      min: Math.min(acc.min, v.min),
      max: Math.max(acc.max, v.max)
    }), {
      min: Infinity,
      max: -Infinity
    });
    if (!Number.isFinite(yRange.min) || !Number.isFinite(yRange.max)) {
      return false;
    }
    const newRange = (0, utils_1.addMargin)({
      start: yRange.min,
      end: yRange.max
    }, global_1.g.config.toolbars.marginFactorY);
    this.setYRange(newRange.start, newRange.end);
    return true;
  }
  fitContentY() {
    const x1 = this.fig.x_range.start;
    const x2 = this.fig.x_range.end;
    const rawRange = this.computeYRangeFromXRange(x1, x2);
    if (rawRange == null) {
      return;
    }
    const {
      start,
      end
    } = (0, utils_1.addMargin)(rawRange, global_1.g.config.toolbars.marginFactorY);
    this.setYRange(start, end);
  }
  computeYRangeFromXRange(x1, x2) {
    if (this.dataTransformer == null) {
      return null;
    }
    const range = this.config.curves.filter(c => c.disabled !== true).map(c => this.dataTransformer.getYRange(c.paramName, x1, x2)).filter(r => r != null).reduce((acc, v) => ({
      start: Math.min(acc.start, v.start),
      end: Math.max(acc.end, v.end)
    }), {
      start: Infinity,
      end: -Infinity
    });
    if (!(0, utils_1.isValueOk)(range.start) || !(0, utils_1.isValueOk)(range.end)) {
      return null;
    }
    return range;
  }
  getCurves() {
    return this.curves;
  }
  updatePointsVisibility() {
    const xSpan = this.fig.x_range.end - this.fig.x_range.start;
    this.curves.forEach(c => {
      c.points.visible = xSpan / c.dt < 50 && c.line.visible;
    });
  }
  updateTrajectories(t1, t2) {}
}
exports.PlotNormal = PlotNormal;

/***/ }),

/***/ "./src/webviews/plots/plots/plot.ts":
/*!******************************************!*\
  !*** ./src/webviews/plots/plots/plot.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Plot = void 0;
const utils_1 = __webpack_require__(/*! ../utils */ "./src/webviews/plots/utils.ts");
const map_tiles_selector_1 = __webpack_require__(/*! ../interactions/map-tiles-selector */ "./src/webviews/plots/interactions/map-tiles-selector.ts");
const defaults_1 = __webpack_require__(/*! ./defaults */ "./src/webviews/plots/plots/defaults.ts");
class Plot {
  constructor(props) {
    this.onXRangeChanged = null;
    this.dataTransformer = props.dataTransformer;
    this.config = props.config;
    // @ts-ignore
    this.fig = null;
    // @ts-ignore
    this.elements = null;
  }
  setOnXRangeChanged(callback) {
    this.onXRangeChanged = callback;
  }
  getConfig() {
    return this.config;
  }
  getBokehFigure() {
    return this.fig;
  }
  isVisible() {
    return this.fig.visible;
  }
  getXRange() {
    return this.fig.x_range;
  }
  getYRange() {
    return this.fig.y_range;
  }
  setXRange(x1, x2) {
    this.fig.x_range.start = x1 !== x2 ? x1 : x1 - 1;
    this.fig.x_range.end = x1 !== x2 ? x2 : x2 + 1;
    this.onXRangeChanged?.(this.fig.x_range.start, this.fig.x_range.end);
  }
  setYRange(y1, y2) {
    this.fig.y_range.start = y1 !== y2 ? y1 : y1 - 1;
    this.fig.y_range.end = y1 !== y2 ? y2 : y2 + 1;
  }
  createLine(config, dataSource) {
    if (config.interpolation == undefined || config.interpolation === "linear" || this.config.mode === "map") {
      return this.fig.line({
        field: "x"
      }, {
        field: "y"
      }, {
        source: dataSource,
        legend_label: config.legendLabel ?? config.paramName,
        line_color: config.lineColor,
        line_alpha: config.lineAlpha,
        line_width: config.lineWidth,
        line_dash: config.lineStyle
      });
    } else {
      return this.fig.step({
        field: "x"
      }, {
        field: "y"
      }, "after", {
        source: dataSource,
        legend_label: config.legendLabel ?? config.paramName,
        line_color: config.lineColor,
        line_alpha: config.lineAlpha,
        line_width: config.lineWidth,
        line_dash: config.lineStyle
      });
    }
  }
  createLine2(config, dataSource) {
    return this.fig.line({
      field: "x2"
    }, {
      field: "y2"
    }, {
      source: dataSource,
      line_color: config.lineColor,
      line_alpha: config.lineAlpha,
      line_width: config.lineWidth,
      line_dash: config.lineStyle
    });
  }
  createPoints(config, dataSource) {
    return this.fig.scatter({
      field: "x"
    }, {
      field: "y"
    }, {
      source: dataSource,
      marker: "dot",
      line_color: config.lineColor,
      line_alpha: config.lineAlpha,
      size: 10,
      visible: false
    });
  }
  setElements(elements) {
    this.elements = elements;
    this.elements.layer2.style.pointerEvents = "none";
    this.elements.canvasLayer1.style.pointerEvents = "none";
    this.elements.canvasLayer2.style.pointerEvents = "none";
    this.elements.layerEvents.style.pointerEvents = "none";
    if (this.elements.originalLegend != null) {
      this.elements.originalLegend.style.pointerEvents = "none";
    }
    this.elements.frame.style.cursor = "crosshair";
    this.elements.xaxis.style.cursor = "grab";
    if (this.config.mode !== "booleans") {
      this.elements.yaxis.style.cursor = "grab";
    }
    this.elements.glyphs.forEach(elt => {
      elt.style.pointerEvents = "none";
    });
    if (this.config.mode === "map") {
      this.elements.frame.style.overflow = "hidden";
      (0, map_tiles_selector_1.setAttribution)(this, this.config.mapTiles ?? defaults_1.defaultMapTiles);
      this.getCurves().forEach(c => {
        const acSymbol = (0, utils_1.copyTemplate)("aircraft-symbol");
        acSymbol.style.backgroundColor = c.config.lineColor;
        this.elements.frame.shadowRoot?.appendChild(acSymbol);
        this.elements.interactibles.crosshair.aircraftSymbols.push(acSymbol);
      });
    }
  }
}
exports.Plot = Plot;

/***/ }),

/***/ "./src/webviews/plots/utils.ts":
/*!*************************************!*\
  !*** ./src/webviews/plots/utils.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.mercator = void 0;
exports.lim = lim;
exports.addMargin = addMargin;
exports.minmax = minmax;
exports.isValueOk = isValueOk;
exports.getLastValueOkBefore = getLastValueOkBefore;
exports.getPreviousAssumingEquallySpaced = getPreviousAssumingEquallySpaced;
exports.getNextAssumingEquallySpaced = getNextAssumingEquallySpaced;
exports.getPreviousByDichotomy = getPreviousByDichotomy;
exports.getNextByDichotomy = getNextByDichotomy;
exports.copyTemplate = copyTemplate;
exports.computePositionInPlotReference = computePositionInPlotReference;
exports.computePositionInElementReference = computePositionInElementReference;
exports.getPlotsElements = getPlotsElements;
const global_1 = __webpack_require__(/*! ./global */ "./src/webviews/plots/global.ts");
// MARK: simple functions
function lim(input, min, max) {
  if (input < min) {
    return min;
  }
  if (input > max) {
    return max;
  }
  return input;
}
function addMargin(range, coeff) {
  const offset = (coeff ?? 0.05) * (range.end - range.start);
  let start = range.start - offset;
  let end = range.end + offset;
  if (start === end) {
    start = 0.999 * end;
    end = 1.001 * end;
  }
  return {
    start,
    end
  };
}
function minmax(values) {
  return values.reduce((acc, v) => {
    if (v > acc.max && v < acc.min) {
      return {
        min: v,
        max: v
      };
    }
    if (v > acc.max) {
      return {
        ...acc,
        max: v
      };
    }
    if (v < acc.min) {
      return {
        ...acc,
        min: v
      };
    }
    return acc;
  }, {
    min: Infinity,
    max: -Infinity
  });
}
function isValueOk(x) {
  return Number.isFinite(x) && !Number.isNaN(x);
}
function getLastValueOkBefore(array, index) {
  if (index < 0 || index >= array.length) {
    return undefined;
  }
  const v = array[index];
  if (isValueOk(v)) {
    return v;
  }
  // otherwise, we search backward for the last non-nan value
  for (let i = index - 1; i >= 0; i--) {
    if (isValueOk(array[i])) {
      return array[i];
    }
  }
  return undefined;
}
// MARK: get index
function getPreviousAssumingEquallySpaced(array, target) {
  if (array.length < 2) {
    return null;
  }
  const dt = array[1] - array[0];
  if (target < array[0]) {
    return null;
  } else if (target >= array[array.length - 1] + dt) {
    return null;
  } else {
    return Math.floor((target - array[0]) / dt);
  }
}
function getNextAssumingEquallySpaced(array, target) {
  if (array.length < 2) {
    return null;
  }
  const dt = array[1] - array[0];
  if (target <= array[0] - dt) {
    return null;
  } else if (target > array[array.length - 1]) {
    return null;
  } else {
    return Math.ceil((target - array[0]) / dt);
  }
}
function getPreviousByDichotomy(array, target) {
  const n = array.length;
  if (n < 2) {
    return null;
  }
  if (target < array[0]) {
    return null;
  }
  if (target > array[n - 1]) {
    return null;
  }
  let imin = 0;
  let imax = n - 1;
  let icurrent = 0;
  do {
    icurrent = Math.floor(0.5 * (imin + imax));
    if (target < array[icurrent]) {
      imax = icurrent;
    } else {
      imin = icurrent;
    }
  } while (imax != imin + 1);
  if (array[imax] === target) {
    return imax;
  }
  return imin;
}
function getNextByDichotomy(array, target) {
  const n = array.length;
  if (n < 2) {
    return null;
  }
  if (target < array[0]) {
    return null;
  }
  if (target > array[n - 1]) {
    return null;
  }
  let imin = 0;
  let imax = n - 1;
  let icurrent = 0;
  do {
    icurrent = Math.floor(0.5 * (imin + imax));
    if (target < array[icurrent]) {
      imax = icurrent;
    } else {
      imin = icurrent;
    }
  } while (imax != imin + 1);
  if (array[imin] === target) {
    return imin;
  }
  return imax;
}
// MARK: mercator
const R = 6378137; // Earth’s radius in meters
exports.mercator = {
  lonToX: lon => {
    return lon * R * Math.PI / 180;
  },
  latToY: lat => {
    return R * Math.log(Math.tan((90 + lat) * Math.PI / 360));
  },
  xToLon: x => {
    return x / (R * Math.PI / 180);
  },
  yToLat: y => {
    return 360 / Math.PI * Math.atan(Math.exp(y / R)) - 90;
  }
};
// MARK: copy template
function copyTemplate(templateId) {
  const template = document.getElementById(templateId);
  const docFrag = document.importNode(template.content, true);
  return docFrag.children[0];
}
// MARK: compute position
function computePositionInPlotReference(plot, event) {
  const rect = plot.elements.frame.getBoundingClientRect();
  const xr = plot.getXRange();
  const yr = plot.getYRange();
  const x = xr.min + (xr.max - xr.min) * (event.clientX - rect.left) / rect.width;
  const y = yr.min + (yr.max - yr.min) * (rect.bottom - event.clientY) / rect.height;
  return !global_1.g.config.dragAndDrop.limitInView ? {
    x,
    y
  } : {
    x: lim(x, xr.start, xr.end),
    y: lim(y, yr.start, yr.end)
  };
}
function computePositionInElementReference(plot, x, y) {
  const rect = plot.elements.frame.getBoundingClientRect();
  const xr = plot.getXRange();
  const yr = plot.getYRange();
  const clientX = rect.left + rect.width * (x - xr.min) / (xr.max - xr.min);
  const clientY = rect.bottom - rect.height * (y - yr.min) / (yr.max - yr.min);
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}
function getPlotsElements() {
  const eltMain = document.querySelector("#main");
  if (eltMain == null) {
    console.warn(`Failed to find "#main"`);
    return null;
  }
  const bkGridPlot = document.querySelector(".bk-GridPlot");
  if (bkGridPlot == null) {
    console.warn(`Failed to find ".bk-GridPlot"`);
    return null;
  }
  const bkGridBox = bkGridPlot.shadowRoot?.querySelector(".bk-GridBox");
  if (bkGridBox == null) {
    console.warn(`Failed to find ".bk-GridBox"`);
    return null;
  }
  const bkFigures1 = bkGridBox.shadowRoot?.querySelectorAll(".bk-Figure");
  if (bkFigures1 == undefined) {
    return null;
  }
  const bkFigures2 = [...bkFigures1];
  return {
    main: eltMain,
    bkGridPlot,
    bkGridBox,
    bkFigures: bkFigures2.map(elt => getZones(elt)).filter(x => x != null)
  };
}
function getZones(plotElement) {
  if (!plotElement.classList.contains("bk-Figure")) {
    console.warn(`Failed to find ".bk-Figure"`);
    return null;
  }
  const elt1 = plotElement.shadowRoot?.querySelector(".bk-Canvas");
  if (elt1 == null) {
    console.warn(`Failed to find ".bk-Canvas"`);
    return null;
  }
  const divLayers = [...(elt1.shadowRoot?.querySelectorAll("div.bk-layer") ?? [])];
  if (divLayers.length !== 3) {
    console.warn(`Failed to find the 3 "div.bk-layer"`);
    return null;
  }
  const frame = divLayers[0].querySelector("div.bk-CartesianFrame");
  const axes = [...divLayers[0].querySelectorAll("div.bk-LinearAxis"), ...divLayers[0].querySelectorAll("div.bk-MercatorAxis")];
  if (frame == null || axes.length !== 2) {
    return null;
  }
  const glyphs = [...divLayers[0].querySelectorAll("div.bk-GlyphRenderer")];
  const originalLegend = divLayers[0].querySelector("div.bk-Legend");
  const canvasLayers = [...(elt1.shadowRoot?.querySelectorAll("canvas.bk-layer") ?? [])];
  if (canvasLayers.length !== 2) {
    console.warn(`Failed to find the 2 "canvas.bk-layer"`);
    return null;
  }
  const crosshairHorizontalLine = copyTemplate("crosshair-hline");
  const crosshairVerticalLine = copyTemplate("crosshair-vline");
  const yValue = copyTemplate("y-value");
  const xValue = copyTemplate("x-value");
  const customLegend = copyTemplate("legend-frame");
  const selectionRect = copyTemplate("selection-rect");
  const selectionBandX = copyTemplate("selection-band-x");
  const selectionBandY = copyTemplate("selection-band-y");
  const mapTilesSelection = copyTemplate("map-tiles-selection");
  const mapTilesAttribution = copyTemplate("map-tiles-attribution");
  frame.shadowRoot?.appendChild(crosshairHorizontalLine);
  frame.shadowRoot?.appendChild(crosshairVerticalLine);
  axes[0]?.shadowRoot?.appendChild(xValue);
  axes[1]?.shadowRoot?.appendChild(yValue);
  frame.shadowRoot?.appendChild(customLegend);
  frame.shadowRoot?.appendChild(selectionRect);
  frame.shadowRoot?.appendChild(selectionBandX);
  frame.shadowRoot?.appendChild(selectionBandY);
  frame.shadowRoot?.appendChild(mapTilesSelection);
  frame.shadowRoot?.appendChild(mapTilesAttribution);
  return {
    layer1: divLayers[0],
    frame,
    xaxis: axes[0],
    yaxis: axes[1],
    layer2: divLayers[1],
    layerEvents: divLayers[2],
    canvasLayer1: canvasLayers[0],
    canvasLayer2: canvasLayers[1],
    glyphs,
    originalLegend,
    interactibles: {
      crosshair: {
        hline: crosshairHorizontalLine,
        vline: crosshairVerticalLine,
        xvalue: xValue,
        yvalue: yValue,
        aircraftSymbols: []
      },
      customLegend,
      selectionRect,
      selectionBandX,
      selectionBandY,
      mapTilesSelector: {
        element: mapTilesSelection,
        radios: [...mapTilesSelection.querySelectorAll("input")].map(input => ({
          input,
          value: input.nextElementSibling?.textContent ?? ""
        }))
      },
      mapTilesAttribution
    }
  };
}

/***/ }),

/***/ "@bokeh/bokehjs":
/*!************************!*\
  !*** external "Bokeh" ***!
  \************************/
/***/ ((module) => {

module.exports = globalThis["Bokeh"];

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(async () => {
var exports = __webpack_exports__;
/*!************************************!*\
  !*** ./src/webviews/plots/main.ts ***!
  \************************************/


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
const Bokeh = __webpack_require__(/*! @bokeh/bokehjs */ "@bokeh/bokehjs");
// import {DataTransformer, FdoatDataTransformer} from "./data-transformers";
const data_transformers_1 = __webpack_require__(/*! ./data-transformers */ "./src/webviews/plots/data-transformers/index.ts");
const utils_1 = __webpack_require__(/*! ./utils */ "./src/webviews/plots/utils.ts");
const plots_1 = __webpack_require__(/*! ./plots */ "./src/webviews/plots/plots/index.ts");
const interactions = __webpack_require__(/*! ./interactions */ "./src/webviews/plots/interactions/index.ts");
// MARK: dummy data & layout
async function gzippedBase64ToUtf8(base64) {
  const compressedBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([compressedBytes]).stream().pipeThrough(ds);
  const decompressedBytes = await new Response(stream).arrayBuffer();
  return new TextDecoder("utf-8").decode(decompressedBytes);
}

function base64ToUtf8(base64) {
  return new TextDecoder("utf-8").decode(
    Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  );
}

const parametersStr = document.querySelector("#data-parameters").textContent;
const parameters = JSON.parse(JSON.parse(await gzippedBase64ToUtf8(parametersStr))).map(p => ({...p, values: p.values.map(v => (v == null) ? NaN : v)}));

const layoutStr = document.querySelector("#data-layout").textContent;
const layout = JSON.parse(JSON.parse(base64ToUtf8(layoutStr)));

// MARK: main
// const dataTransformer = new FdoatDataTransformer({data, ifParamNotFound: "show-in-legend"});
const dataTransformer = new data_transformers_1.CsvDataTransformer({
  parameters,
  timeParamName: "time",
  ifParamNotFound: "show-in-legend"
});
const plots = buildPlots(layout, dataTransformer);
const grid = buildPage(plots, layout.sizingPolicy);
Bokeh.Plotting.show(grid, "#main");
setTimeout(() => {
  onLoad();
}, 5);
// MARK: functions
function buildPlots(layout, dataTransformer) {
  const x_range = new Bokeh.Range1d();
  const plots = layout.plots.map(config => {
    config.interpolation = config.interpolation ?? layout.interpolation ?? plots_1.defaultInterpolation;
    if (config.mode === "normal") {
      return new plots_1.PlotNormal({
        config,
        dataTransformer,
        x_range
      });
    } else if (config.mode === "booleans") {
      return new plots_1.PlotBooleans({
        config,
        dataTransformer,
        x_range
      });
    } else {
      return new plots_1.PlotMap({
        config,
        dataTransformer
      });
    }
  });
  const onXRangeChanged = (t1, t2) => {
    plots.forEach(p => {
      p.updatePointsVisibility();
      p.updateTrajectories(t1, t2);
    });
  };
  plots.forEach(p => {
    if (p.getConfig().mode !== "map") {
      p.setOnXRangeChanged(onXRangeChanged);
    }
  });
  return plots;
}
;
function buildPage(plots, sizingPolicy) {
  const grid = Bokeh.Plotting.gridplot(plots.map(plot => [plot.getBokehFigure()]), {
    toolbar_location: "above",
    merge_tools: true,
    sizing_mode: "stretch_both"
  });
  if (sizingPolicy === "absolute") {
    for (const plot of plots) {
      plot.getBokehFigure().styles = {
        height: `${plot.getConfig().size ?? 200}px`
      };
    }
  }
  return grid;
}
function onLoad() {
  const elements = (0, utils_1.getPlotsElements)();
  if (elements == null) {
    throw new Error("Failed to find elements");
  }
  // style modifications
  elements.bkGridBox.style.rowGap = "5px";
  if (layout.sizingPolicy === "relative") {
    elements.main.style.height = "100dvh";
    elements.bkGridBox.style.gridTemplateRows = plots.map(p => `${p.isVisible() ? p.getConfig().size ?? 200 : 0}fr`).join(" ");
  }
  plots.forEach((p, i) => {
    p.setElements(elements.bkFigures[i]);
  });
  plots.filter(p => p.getConfig().mode !== "map")[0]?.resetXRange();
  plots.forEach(p => {
    if (p.getConfig().mode === "map") {
      p.resetXRange();
    }
    p.resetYRange();
  });
  // disable context menu
  document.addEventListener("contextmenu", event => {
    event.preventDefault();
  });
  // add toolbars and events
  interactions.addToolbars(plots);
  interactions.addWheelEvents(plots);
  interactions.addDndEvents(plots);
  interactions.addCrosshair(plots);
  interactions.addLegend(plots, dataTransformer);
  interactions.addSettings(plots);
  interactions.addMapTilesSelector(plots);
  // keyboard shortcuts
  document.addEventListener("keydown", event => {
    if (event.key === "Backspace") {
      plots[0]?.resetXRange();
      plots.forEach(p => {
        if (p.getConfig().mode !== "map") {
          p.resetYRange();
        }
      });
    }
  });
}
})();

var __webpack_export_target__ = globalThis;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
