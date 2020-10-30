# tsbuildinfo

Tool to debug slow build times by looking for large type definitions that may have been erroneously imported.


In some typescript projects AWS-SDK has been a very large source of typescript compile slowdowns.
by switching form a base import to directly importing the s3 client the build times for one package went from 6 seconds down to 2 seconds.

```
// Bad
import * as AWS from 'aws-sdk';

// Good
import s3 from 'aws-sdk/clients/s3';
```

## Usage

```
tsbuildinfo <Path to tsconfig.tsbuildinfo>
```


### Example

Here is a repository that has a base import `import * as AWS from 'aws-sdk'`

```
tsbuildinfo ~/basemaps/packages/linzjs-s3fs/tsconfig.tsbuildinfo

Processing /home/blacha/workspace/basemaps/packages/linzjs-s3fs/tsconfig.tsbuildinfo

Largest Imported Modules: 
23.73 MB   aws-sdk
1.13 MB    typescript
684.81 KB  @types/node
81.97 KB   @types/sinon
71.46 KB   @types/aws-lambda

Import Paths:
         ./src/__tests__/file.s3.test.ts => aws-sdk
         ./src/file.s3.ts => aws-sdk
         ./src/index.ts => aws-sdk
         ./src/file.local.ts => @types/node
         ./src/file.s3.ts => @types/node
         ./src/file.ts => @types/node
         ./src/index.ts => @types/node
         ./src/__tests__/file.s3.test.ts => @types/sinon
```


After switching to `import s3 from 'aws-sdk/clients/s3';`

```
Processing /home/blacha/workspace/basemaps/packages/linzjs-s3fs/tsconfig.tsbuildinfo

Largest Imported Modules: 
1.13 MB    typescript
684.81 KB  @types/node
581.09 KB  aws-sdk
81.97 KB   @types/sinon
71.46 KB   @types/aws-lambda

Import Paths:
         ./src/file.local.ts => @types/node
         ./src/file.s3.ts => @types/node
         ./src/file.ts => @types/node
         ./src/index.ts => @types/node
         ./src/__tests__/file.s3.test.ts => aws-sdk
         ./src/file.s3.ts => aws-sdk
         ./src/index.ts => aws-sdk
         ./src/__tests__/file.s3.test.ts => @types/sinon
```