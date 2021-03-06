
export interface PifyOptions {
  multiArgs?: boolean,
  include?: [string | RegExp],
  exclude?: [string | RegExp],
  excludeMain?: boolean
}

// declare function pify(input: Function, promiseModule?: Function, options?: PifyOptions): (...args: any[]) => Promise<any>;
// declare function pify(input: any, promiseModule?: Function, options?: PifyOptions): any;
// declare function pify(input: Function, options?: PifyOptions): (...args: any[]) => Promise<any>;
// declare function pify(input: any, options?: PifyOptions): any;


const processFn = (fn: any, opts: any) => function () {
  const P = opts.promiseModule;
  const args = new Array(arguments.length);

  for (let i = 0; i < arguments.length; i++) {
    args[i] = arguments[i];
  }

  return new P((resolve: any, reject: any) => {
    if (opts.errorFirst) {
    args.push(function (err: any, result: any) {
      if (opts.multiArgs) {
        const results = new Array(arguments.length - 1);

        for (let i = 1; i < arguments.length; i++) {
          results[i - 1] = arguments[i];
        }

        if (err) {
          results.unshift(err);
          reject(results);
        } else {
          resolve(results);
        }
      } else if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  } else {
    args.push(function (result: any) {
      if (opts.multiArgs) {
        const results = new Array(arguments.length - 1);

        for (let i = 0; i < arguments.length; i++) {
          results[i] = arguments[i];
        }

        resolve(results);
      } else {
        resolve(result);
      }
    });
  }

  fn.apply(this, args);
});
};

const pify = (obj: any, opts?: PifyOptions) => {
  opts = Object.assign({
    exclude: [/.+(Sync|Stream)$/],
    errorFirst: true,
    promiseModule: Promise
  }, opts);

  const filter = (key: any) => {
    const match = (pattern: any) => typeof pattern === 'string' ? key === pattern : pattern.test(key);
    return opts!.include ? opts!.include!.some(match) : !opts!.exclude!.some(match);
  };

  let ret;
  if (typeof obj === 'function') {
    ret = function () {
      if (opts!.excludeMain) {
        return obj.apply(this, arguments);
      }

      return processFn(obj, opts).apply(this, arguments);
    };
  } else {
    ret = Object.create(Object.getPrototypeOf(obj));
  }

  for (const key in obj) { // eslint-disable-line guard-for-in
    const x = obj[key];
    ret[key] = typeof x === 'function' && filter(key) ? processFn(x, opts) : x;
  }

  return ret;
};

export default pify
