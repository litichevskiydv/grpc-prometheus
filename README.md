# grpc-prometheus

[![npm version](https://badge.fury.io/js/grpc-prometheus.svg)](https://www.npmjs.com/package/grpc-prometheus)
[![npm downloads](https://img.shields.io/npm/dt/grpc-prometheus.svg)](https://www.npmjs.com/package/grpc-prometheus)
[![dependencies](https://img.shields.io/david/litichevskiydv/grpc-prometheus.svg)](https://www.npmjs.com/package/grpc-prometheus)
[![dev dependencies](https://img.shields.io/david/dev/litichevskiydv/grpc-prometheus.svg)](https://www.npmjs.com/package/grpc-prometheus)
[![Build Status](https://github.com/litichevskiydv/grpc-prometheus/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/litichevskiydv/grpc-prometheus/actions/workflows/ci.yaml)
[![Coverage Status](https://coveralls.io/repos/github/litichevskiydv/grpc-prometheus/badge.svg?branch=master)](https://coveralls.io/github/litichevskiydv/grpc-prometheus?branch=master)

Interceptor for the server to collect statistics of calls through Prometheus

# Install

`npm i grpc-prometheus`

# Usage

```javascript
const { serverInterceptorsFactory } = require("grpc-prometheus");

/*...*/

const server = await new GrpcHostBuilder()
  /*...*/
  .addInterceptor(
    serverInterceptorsFactory({
      timeBuckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 10],
    })
  )
  /*...*/
  .bind(grpcBind)
  .buildAsync();
```

## Metrics example

```
# HELP grpc_server_handled_total Total number of RPCs completed on the server, regardless of success or failure.
# TYPE grpc_server_handled_total counter
grpc_server_handled_total{grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1

# HELP grpc_server_handling_seconds Histogram of response latency (seconds) of gRPC that had been application-level handled by the server.
# TYPE grpc_server_handling_seconds histogram
grpc_server_handling_seconds_bucket{le="0.005",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_bucket{le="0.01",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_bucket{le="0.025",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_bucket{le="0.05",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_bucket{le="0.1",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_bucket{le="0.25",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_bucket{le="0.5",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_bucket{le="1",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_bucket{le="2.5",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_bucket{le="10",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_bucket{le="+Inf",grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
grpc_server_handling_seconds_sum{grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 0.001358001
grpc_server_handling_seconds_count{grpc_code="OK",grpc_method="SayHello",grpc_service="v1.Greeter",grpc_type="unary"} 1
```
