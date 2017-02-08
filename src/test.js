//import * as foo from "./test2";

export class Foo {
  constructor(x) {
    console.log('foo from es', x);
  }
}

//let f = new foo.Bar(6);
let f = new Foo(7);
