import * as changeCase from 'change-case';
import { FGCInstanceName } from '../models';

export class FCGChangeCase {
    public static AllCasingPlaceholderMap = [
        {
            casing: 'PASCAL',
            casingFn: changeCase.pascalCase,
        },
        {
            casing: 'CAMEL',
            casingFn: changeCase.camelCase,
        },
        {
            casing: 'CAPITAL',
            casingFn: changeCase.capitalCase,
        },
        {
            casing: 'DOT',
            casingFn: changeCase.dotCase,
        },
        {
            casing: 'CONSTANT',
            casingFn: changeCase.constantCase,
        },
        {
            casing: 'PASCAL',
            casingFn: changeCase.pascalCase,
        },
        {
            casing: 'PARAM',
            casingFn: changeCase.paramCase,
        },
        {
            casing: 'KEBAB',
            casingFn: changeCase.paramCase,
        },
        {
            casing: 'HEADER',
            casingFn: changeCase.headerCase,
        },
        {
            casing: 'NO',
            casingFn: changeCase.noCase,
        },
        {
            casing: 'SENTENCE',
            casingFn: changeCase.sentenceCase,
        },
        {
            casing: 'PATH',
            casingFn: changeCase.pathCase,
        },
        {
            casing: 'CAPITAL',
            casingFn: changeCase.capitalCase,
        },
    ];

    public static PlaceHolderConstructor(
        casing: string,
        prefixed = false,
        plural = false
    ): string {
        return `{{${prefixed ? 'PREFIXED_' : ''}${
            plural ? 'PLURAL_' : 'SINGULAR_'
        }${casing}}}`;
    }

    public static Replace(
        value: string,
        instanceName: FGCInstanceName
    ): string {
        this.AllCasingPlaceholderMap.forEach((e) => {
            value = value
                .replace(
                    new RegExp(this.PlaceHolderConstructor(e.casing), 'gi'),
                    e.casingFn(instanceName.singular)
                )
                .replace(
                    new RegExp(
                        this.PlaceHolderConstructor(e.casing, false, true),
                        'gi'
                    ),
                    e.casingFn(instanceName.plural)
                );

            if (instanceName.prefix) {
                value = value
                    .replace(
                        new RegExp(
                            this.PlaceHolderConstructor(e.casing, true),
                            'gi'
                        ),
                        e.casingFn(
                            `${instanceName.prefix} ${instanceName.singular}`
                        )
                    )
                    .replace(
                        new RegExp(
                            this.PlaceHolderConstructor(e.casing, true, true),
                            'gi'
                        ),
                        e.casingFn(
                            `${instanceName.prefix} ${instanceName.plural}`
                        )
                    );
            }
        });

        return value;
    }

    public static Deduce(value: string, instanceName: FGCInstanceName): string {
        this.AllCasingPlaceholderMap.forEach((e) => {
            if (instanceName.prefix) {
                value = value.replace(
                    new RegExp(
                        e.casingFn(
                            `${instanceName.prefix} ${instanceName.singular}`
                        ),
                        'g'
                    ),
                    this.PlaceHolderConstructor(e.casing, true, false)
                );
                if (instanceName.plural) {
                    value = value.replace(
                        new RegExp(
                            e.casingFn(
                                `${instanceName.prefix} ${instanceName.plural}`
                            ),
                            'g'
                        ),
                        this.PlaceHolderConstructor(e.casing, true, true)
                    );
                }
            }

            value = value.replace(
                new RegExp(e.casingFn(instanceName.singular), 'g'),
                this.PlaceHolderConstructor(e.casing)
            );
            if (instanceName.plural) {
                value = value.replace(
                    new RegExp(e.casingFn(instanceName.plural), 'g'),
                    this.PlaceHolderConstructor(e.casing, false, true)
                );
            }
        });

        return value;
    }
}
