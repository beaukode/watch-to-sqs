import * as fs from "fs";
import * as path from "path";

export default class Move {
  protected archivesPath: string;
  protected errorsPath: string;
  public constructor(archivesPath: string, errorsPath: string) {
    this.archivesPath = archivesPath;
    this.errorsPath = errorsPath;
    if (!fs.existsSync(archivesPath)) {
      fs.mkdirSync(archivesPath, { recursive: true });
    }
    if (!fs.existsSync(errorsPath)) {
      fs.mkdirSync(errorsPath, { recursive: true });
    }
  }

  public toArchives(file: string) {
    let dest = path.join(
      this.archivesPath,
      path.basename(file)
    );
    if (fs.existsSync(dest)) {
      dest += "-" + Date.now();
    }
    if (!fs.existsSync(path.dirname(dest))) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
    }
    fs.renameSync(file, dest);
  }

  public toError(file: string) {
    let dest = path.join(this.errorsPath, path.basename(file));
    if (fs.existsSync(dest)) {
      dest += "-" + Date.now();
    }
    if (!fs.existsSync(path.dirname(dest))) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
    }
    fs.renameSync(file, dest);
  }
}
