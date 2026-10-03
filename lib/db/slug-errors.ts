export class SlugConflictError extends Error {
  readonly slug: string;

  constructor(slug: string) {
    super(`Slug "${slug}" is already in use. Choose a different slug.`);
    this.name = "SlugConflictError";
    this.slug = slug;
  }
}

export class NameConflictError extends Error {
  readonly conflictName: string;

  constructor(name: string) {
    super(`Name "${name}" is already in use. Choose a different name.`);
    this.name = "NameConflictError";
    this.conflictName = name;
  }
}
