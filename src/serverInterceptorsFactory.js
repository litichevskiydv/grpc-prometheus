const { status } = require("@grpc/grpc-js");
const { Counter, Histogram } = require("prom-client");

const statusesByCodes = new Map([
  [status.OK, "OK"],
  [status.CANCELLED, "Canceled"],
  [status.UNKNOWN, "Unknown"],
  [status.INVALID_ARGUMENT, "InvalidArgument"],
  [status.DEADLINE_EXCEEDED, "DeadlineExceeded"],
  [status.NOT_FOUND, "NotFound"],
  [status.ALREADY_EXISTS, "AlreadyExists"],
  [status.PERMISSION_DENIED, "PermissionDenied"],
  [status.RESOURCE_EXHAUSTED, "ResourceExhausted"],
  [status.FAILED_PRECONDITION, "FailedPrecondition"],
  [status.ABORTED, "Aborted"],
  [status.OUT_OF_RANGE, "OutOfRange"],
  [status.UNIMPLEMENTED, "Unimplemented"],
  [status.INTERNAL, "Internal"],
  [status.UNAVAILABLE, "Unavailable"],
  [status.DATA_LOSS, "DataLoss"],
  [status.UNAUTHENTICATED, "Unauthenticated"],
]);
const defaultTimeBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 10];

/**
 * @param {number[]} timeBuckets
 */
const configureMetrics = (timeBuckets) => ({
  grpcServerHandledTotal: new Counter({
    name: "grpc_server_handled_total",
    labelNames: ["grpc_code", "grpc_method", "grpc_service", "grpc_type"],
    help: "Total number of RPCs completed on the server, regardless of success or failure.",
  }),
  grpcServerHandlingSeconds: new Histogram({
    name: "grpc_server_handling_seconds",
    buckets: timeBuckets,
    labelNames: ["grpc_code", "grpc_method", "grpc_service", "grpc_type"],
    help: "Histogram of response latency (seconds) of gRPC that had been application-level handled by the server.",
  }),
});

/**
 * @param {string} path
 * @returns {{serviceName: string, methodName: string}}
 */
const parseMethodPath = (path) => {
  const [, serviceName, methodName] = path.split("/");
  return { serviceName, methodName };
};

/**
 * @param {import("@grpc/grpc-js").MethodDefinition} methodDefinition
 * @returns {"bidi" | "clientStream" | "serverStream" | "unary"}
 */
const getMethodType = (methodDefinition) => {
  if (methodDefinition.requestStream) return methodDefinition.responseStream ? "bidi" : "clientStream";
  return methodDefinition.responseStream ? "serverStream" : "unary";
};

/**
 * @param {[number, number]} startTime
 */
const getElapsedMilliseconds = (startTime) => {
  const diff = process.hrtime(startTime);
  return diff[0] * 1e3 + diff[1] * 1e-6;
};

/**
 * @param {InterceptorsFactoryOptions} [options] Interceptor creation options.
 */
module.exports = function (options) {
  const opts = options || {};
  const { grpcServerHandledTotal, grpcServerHandlingSeconds } = configureMetrics(
    opts.timeBuckets || defaultTimeBuckets
  );

  return async (call, methodDefinition, next) => {
    const { serviceName, methodName } = parseMethodPath(methodDefinition.path);
    const methodType = getMethodType(methodDefinition);

    let callStatus = statusesByCodes.get(status.OK);
    const startTime = process.hrtime();
    try {
      return await next(call);
    } catch (error) {
      callStatus = statusesByCodes.get(error.code) || statusesByCodes.get(status.INTERNAL);
      throw error;
    } finally {
      grpcServerHandledTotal.labels(callStatus, methodName, serviceName, methodType).inc();
      grpcServerHandlingSeconds
        .labels(callStatus, methodName, serviceName, methodType)
        .observe(getElapsedMilliseconds(startTime) / 1000);
    }
  };
};

/**
 * @typedef {Object} InterceptorsFactoryOptions
 * @property {number[]} [timeBuckets] Buckets for the request duration metrics (in seconds) histogram.
 */
