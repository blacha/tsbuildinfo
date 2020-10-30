# tsbuildinfo

Tool to debug slow build times by looking for large type definitions that may have been errorensoly imported.


In some typescript projects AWS-SDK has been a very large source of typescript compile slowdowns.

by switching form a base import to directly importing the clients the build times from 5.97 seconds down to 2 seconds.

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