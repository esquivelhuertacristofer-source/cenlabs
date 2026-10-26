import * as m221 from './_proc-221.js';
import * as m222 from './_proc-222.js';
import * as m223 from './_proc-223.js';
import * as m224 from './_proc-224.js';
import * as m225 from './_proc-225.js';
import * as m226 from './_proc-226.js';
import * as m227 from './_proc-227.js';
import * as m228 from './_proc-228.js';
import * as m229 from './_proc-229.js';
import * as m230 from './_proc-230.js';
const modules={221:m221,222:m222,223:m223,224:m224,225:m225,226:m226,227:m227,228:m228,229:m229,230:m230};
export function build(id,ctx){return modules[id].build(ctx);}
export function update(v,m,p){modules[v.id].update(v,m,p);}
