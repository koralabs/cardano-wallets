let cardanoWasm: any = null;

export const loadCardanoWasm = async () => {
    if (cardanoWasm) {
        return cardanoWasm;
    }

    cardanoWasm = await import('@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib');
    return cardanoWasm;
};
