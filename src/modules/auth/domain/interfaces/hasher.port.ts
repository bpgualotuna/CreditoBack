/** Port for one-way password hashing. */
export abstract class HasherPort {
  abstract hash(plain: string): Promise<string>;
  abstract compare(plain: string, hash: string): Promise<boolean>;
}
