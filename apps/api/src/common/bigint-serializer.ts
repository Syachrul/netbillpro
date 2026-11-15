// Global BigInt -> string serializer.
// Wajib di-load sekali sebelum Fastify serialize response.
// Reference: Fastify + Prisma BigInt incompatibility.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

export {};
