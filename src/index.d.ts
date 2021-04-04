import {
  MethodDefinition,
  InterceptingCall,
  ServerUnaryCall,
  ServerWritableStream,
  ServerReadableStream,
  ServerDuplexStream,
} from "@grpc/grpc-js";

interface InterceptorsFactoryOptions {
  timeBuckets?: Array<number>;
}

export function serverInterceptorsFactory(
  options?: InterceptorsFactoryOptions
): (
  call: ServerUnaryCall<any> | ServerWritableStream<any> | ServerReadableStream<any> | ServerDuplexStream<any, any>,
  methodDefinition: MethodDefinition<any, any>,
  next: Function
) => Promise<any>;
