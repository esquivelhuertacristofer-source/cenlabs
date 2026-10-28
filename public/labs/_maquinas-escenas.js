import * as m231 from './_maq-231.js';
import * as m232 from './_maq-232.js';
import * as m233 from './_maq-233.js';
import * as m234 from './_maq-234.js';
import * as m235 from './_maq-235.js';
import * as m236 from './_maq-236.js';
import * as m237 from './_maq-237.js';
import * as m238 from './_maq-238.js';
import * as m239 from './_maq-239.js';
import * as m240 from './_maq-240.js';
const modules={231:m231,232:m232,233:m233,234:m234,235:m235,236:m236,237:m237,238:m238,239:m239,240:m240};
export function build(id,ctx){return modules[id].build(ctx);}
export function update(v,m,p){modules[v.id].update(v,m,p);}
