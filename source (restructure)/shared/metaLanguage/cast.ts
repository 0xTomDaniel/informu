import { getOrElse } from "fp-ts/Either";
import { pipe } from "fp-ts/pipeable";
import * as D from "io-ts/lib/Decoder";

export const cast = <I, A>(value: I, decoder: D.Decoder<I, A>): A =>
    pipe(
        decoder.decode(value),
        getOrElse<D.DecodeError, A>(errors => {
            throw new Error(D.draw(errors));
        })
    );
