import * as adminSchemas from "./schemas/Admin";

// Example library code that is common to both the client and server
export function libTest(name: string): string {
    return `Hello from library to ${name}`;
}

export { adminSchemas };
