import { describe,it,expect } from 'vitest';
import { registrationSchema } from '../src/lib/validation';
import { newToken,tokenHash,assertOrigin } from '../src/lib/security';
describe('Registration and session security',()=>{
 const valid={fullName:'Test Artist',email:'ARTIST@example.com',phone:'+968 9212 3456',terms:true};
 it('normalizes contacts and leaves marketing unchecked',()=>{const a=registrationSchema.parse(valid);expect(a.email).toBe('artist@example.com');expect(a.phone).toBe('+96892123456');expect(a.marketing).toBe(false);});
 it('rejects invalid contacts and missing terms',()=>{for(const patch of [{phone:'123'},{email:'bad'},{fullName:' '},{terms:false}])expect(registrationSchema.safeParse({...valid,...patch}).success).toBe(false);});
 it('issues unpredictable session credentials and stores a distinct digest',()=>{const a=newToken(),b=newToken();expect(a).not.toBe(b);expect(a.length).toBeGreaterThanOrEqual(43);expect(tokenHash(a)).toHaveLength(64);expect(tokenHash(a)).not.toBe(a);});
 it('rejects cross-site and missing-origin mutations',()=>{process.env.APP_ORIGIN='http://localhost:3000';expect(()=>assertOrigin(new Request('http://localhost:3000',{headers:{origin:'https://evil.example'}}))).toThrow();expect(()=>assertOrigin(new Request('http://localhost:3000'))).toThrow();expect(()=>assertOrigin(new Request('http://localhost:3000',{headers:{origin:'http://localhost:3000'}}))).not.toThrow();});
});
