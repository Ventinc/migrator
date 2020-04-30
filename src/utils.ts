import fs from "fs";

export class PlatformTools {
  static load(name: string) {
    try {
      return require(name);
    } catch (err) {
      throw err;
    }
  }

  static fileExist(pathStr: string): boolean {
    return fs.existsSync(pathStr);
  }

  static esmResolver(output: any) {
    return output && output.__esModule && output.default
      ? output.default
      : output;
  }

  static esmRequire(filePath: string) {
    return this.esmResolver(require(filePath));
  }
}
