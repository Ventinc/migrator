import fs from "fs-extra";
import { dirname } from "path";

export class PlatformTools {
  static fileExist(pathStr: string): boolean {
    return fs.existsSync(pathStr);
  }

  static async add(path: string, content: string) {
    await fs.ensureDir(dirname(path));
    await fs.outputFile(path, content);
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

export function camelCase(str: string, firstCapital: boolean = false): string {
  return str.replace(/^([A-Z])|[\s-_](\w)/g, function (match, p1, p2, offset) {
    if (firstCapital === true && offset === 0) return p1;
    if (p2) return p2.toUpperCase();
    return p1.toLowerCase();
  });
}
