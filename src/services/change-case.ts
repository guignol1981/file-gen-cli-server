import * as changeCase from 'change-case';
import { FGCInstanceName } from '../models';

export class FCGChangeCase {
    public static AllCasingPlaceholderMap = [
        {
            placeholder: '{{SINGULAR_CAMEL}}',
            casingFn: changeCase.pascalCase,
        },
        {
            placeholder: '{{SINGULAR_CAPITAL}}',
            casingFn: changeCase.capitalCase,
        },
        {
            placeholder: '{{SINGULAR_DOT}}',
            casingFn: changeCase.dotCase,
        },
        {
            placeholder: '{{SINGULAR_CONSTANT}}',
            casingFn: changeCase.constantCase,
        },
        {
            placeholder: '{{SINGULAR_PASCAL}}',
            casingFn: changeCase.pascalCase,
        },
        {
            placeholder: '{{SINGULAR_PARAM}}',
            casingFn: changeCase.paramCase,
        },
        {
            placeholder: '{{SINGULAR_KEBAB}}',
            casingFn: changeCase.paramCase,
        },
        {
            placeholder: '{{SINGULAR_HEADER}}',
            casingFn: changeCase.headerCase,
        },
        {
            placeholder: '{{SINGULAR_NO}}',
            casingFn: changeCase.noCase,
        },
        {
            placeholder: '{{SINGULAR_SENTENCE}}',
            casingFn: changeCase.sentenceCase,
        },
        {
            placeholder: '{{SINGULAR_PATH}}',
            casingFn: changeCase.pathCase,
        },
        {
            placeholder: '{{SINGULAR_CAPITAL}}',
            casingFn: changeCase.capitalCase,
        },
    ];

    public static Replace(
        value: string,
        instanceName: FGCInstanceName
    ): string {
        this.AllCasingPlaceholderMap.forEach((e) => {
            value = value
                .replace(
                    new RegExp(e.placeholder, 'gi'),
                    e.casingFn(instanceName.singular)
                )
                .replace(
                    new RegExp(e.placeholder, 'gi'),
                    e.casingFn(instanceName.plural)
                );

            if (instanceName.prefix) {
                value = value
                    .replace(
                        new RegExp(e.placeholder, 'gi'),
                        e.casingFn(
                            `${instanceName.prefix} ${instanceName.singular}`
                        )
                    )
                    .replace(
                        new RegExp(e.placeholder, 'gi'),
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
                    e.placeholder
                );
                if (instanceName.plural) {
                    value = value.replace(
                        new RegExp(
                            e.casingFn(
                                `${instanceName.prefix} ${instanceName.plural}`
                            ),
                            'g'
                        ),
                        e.placeholder
                    );
                }
            }

            value = value.replace(
                new RegExp(e.casingFn(instanceName.singular), 'g'),
                e.placeholder
            );
            if (instanceName.plural) {
                value = value.replace(
                    new RegExp(e.casingFn(instanceName.plural), 'g'),
                    e.placeholder
                );
            }
        });

        return value;
    }
}
