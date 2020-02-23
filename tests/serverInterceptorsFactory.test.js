const path = require("path");
const grpc = require("grpc");
const { register: metricsRegistry } = require("prom-client");
const { GrpcHostBuilder } = require("grpc-host-builder");
const { loadSync } = require("grpc-pbf-loader").packageDefinition;

const { serverInterceptorsFactory } = require("../src/index");

const {
  HelloRequest: ServerHelloRequest,
  HelloResponse: ServerHelloResponse,
  ErrorRequest: ServerErrorRequest
} = require("./generated/server/greeter_pb").v1;
const {
  Event,
  HelloRequest: ClientHelloRequest,
  ErrorRequest: ClientErrorRequest,
  GreeterClient
} = require("./generated/client/greeter_client_pb").v1;

const grpcBind = "0.0.0.0:3000";
const packageObject = grpc.loadPackageDefinition(
  loadSync(path.join(__dirname, "./protos/greeter.proto"), {
    includeDirs: [path.join(__dirname, "./include/")]
  })
);

/** @type {import("grpc").Server} */
let server = null;
/** @type {GreeterClient} */
let client = null;

/**
 * @returns {import("grpc").Server}
 */
const createServer = () =>
  new GrpcHostBuilder()
    .useLoggersFactory(() => ({ error: jest.fn() }))
    .addInterceptor(serverInterceptorsFactory())
    .addService(packageObject.v1.Greeter.service, {
      sayHello: async call => {
        const request = new ServerHelloRequest(call.request);

        const event = request.event;
        event.id = event.name.charCodeAt(0);
        return new ServerHelloResponse({ event });
      },
      throwError: () => {
        throw new Error("Something went wrong");
      }
    })
    .bind(grpcBind)
    .build();

/**
 * @param {string} [name]
 * @returns {Promise<import("./generated/client/greeter_client_pb").v1.HelloResponse>}
 */
const sayHello = name => {
  const event = new Event();
  event.setName(name || "Lucky Every");

  const request = new ClientHelloRequest();
  request.setEvent(event);

  return client.sayHello(request);
};

/**
 * @param {import("grpc").CallOptions} [callOptions]
 * @returns {Promise<void>}
 */
const throwError = async callOptions => {
  const request = new ClientErrorRequest();
  request.setSubject("Learning");

  await client.throwError(request, null, callOptions);
};

beforeEach(() => {
  server = createServer();
  client = new GreeterClient(grpcBind, grpc.credentials.createInsecure());
});

afterEach(() => {
  if (client) client.close();
  if (server) server.forceShutdown();
});

test("Must register successful call on the server side", async () => {
  // Given
  const labels = {
    grpc_code: "OK",
    grpc_method: "SayHello",
    grpc_service: "v1.Greeter",
    grpc_type: "unary"
  };

  // When
  await sayHello();

  // Then
  const metrics = metricsRegistry.getMetricsAsJSON();

  const grpcServerHandledTotal = metrics.find(x => x.name === "grpc_server_handled_total");
  expect(grpcServerHandledTotal.values).toEqual(expect.arrayContaining([{ value: 1, labels }]));

  const grpcServerHandlingSeconds = metrics.find(x => x.name === "grpc_server_handling_seconds");
  expect(grpcServerHandlingSeconds.values).toEqual(
    expect.arrayContaining([
      { metricName: "grpc_server_handling_seconds_bucket", labels: { ...labels, le: "+Inf" }, value: 1 },
      { metricName: "grpc_server_handling_seconds_count", labels, value: 1 }
    ])
  );
});
