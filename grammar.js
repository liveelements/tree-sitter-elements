
function commaSep1 (rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep (rule) {
  return optional(commaSep1(rule));
}

module.exports = grammar(require('tree-sitter-typescript/typescript/grammar'), {
  name: 'elements',
  precedences: ($, previous) => previous.concat([
    [
      $.subscript_expression,
      $.property_assignment_expression,
      $.property_expression_initializer,
      $.property_assignment,
      $.listener_declaration
    ],
    [
      $.binary_expression,
      $.call_expression,
      $.property_assignment_expression,
      $.property_expression_initializer,
      $.listener_declaration
    ],
    [
      $.binary_expression, 
      $.property_assignment_expression,
      $.property_expression_initializer,
      $.property_assignment,
      $.listener_declaration
    ],
    [
      $.method_definition,
      $.existential_type
    ],
    [
      $._property_name,
      $.generic_type,
      $.readonly_type,
    ],
    [
      $.property_declaration,
      $.nested_identifier,
      $.component_heritage
    ],
    [
      $.component_declaration,
      $.component
    ],
    [
      $.object_type,
      $.statement_block
    ],
    [
      $.object_type,
      $.empty_statement
    ],
    [
      $.primary_expression,
      $.method_signature
    ],
    [
      $.index_signature,
      $.primary_expression
    ],
    [
      $.new_component_expression,
      $.primary_expression
    ],
    [ 
      $.primary_expression,
      $.ambient_declaration
    ]
  ]),

  conflicts: ($, previous) => previous.concat([
    [
      $.index_signature,
      $.method_signature,
      $.property_signature,
      $.primary_expression,
    ],
    [$.primary_expression,$.nested_identifier],
    [$.primary_expression, $.new_tagged_component_expression],
    [
      $._type_query_member_expression,
      $.nested_identifier
    ],
    [$.object_type, $.statement_block],
    [$._property_name, $.static_property_declaration],
    [$.component],
    [$.new_component_expression],
    [$.import_path_segment],
    [$.import_path],
    [
      $.new_component_expression,
      $._type_query_member_expression,
      $.primary_expression
    ],
    [
      $.method_signature,
      $.existential_type
    ],
    [
      $.object_type,
      $.component_body
    ],
    [
      $.nested_identifier,
      $.component_short_heritage
    ]
  ]),

  rules: {
    export_statement: $ => seq('export', $.identifier),

    statement: ($, previous) => {
      const choices = [
        $.import_statement,
        $.js_import_statement
      ]
      choices.push(...previous.members.filter(member =>
          member.name !== 'export_staement' && member.name !== 'import_statement'
      ));
      return choice(...choices)
    },

    primary_expression: ($, previous) => {
      const choices = [
        $.component
      ]
      choices.push(...previous.members);
      return choice(...choices)
    },

    expression: ($, previous) => {
      const choices = [
        $.new_component_expression,
        $.new_tagged_component_expression,
        $.new_tripple_tagged_component_expression
      ]
      choices.push(...previous.members.filter(member =>
          member.name !== 'internal_module'
      ));
      return choice(...choices)
    },

    call_expression: $ => choice(
      prec('call', seq(
        field('function', $.expression),
        field('arguments', $.arguments)
      )),
      prec('member', seq(
        field('function', $.primary_expression),
        field('optional_chain', $.optional_chain),
        field('arguments', $.arguments)
      ))
    ),

    program: $ => seq(
      optional($.hash_bang_line),
      repeat(choice(
        $.import_statement,
        $.js_import_statement,
        $.component_declaration,
        $.component_instance_statement,
      ))
    ),

    property_assignment_expression: $ => $.expression,

    declaration: ($, previous) => choice(
      previous,
      $.component_declaration
    ),

    import: $ => token('import'),
  
    import_statement: $ => prec(1, seq(
      'import',
      $.import_path,
      optional($.import_as)
    )),

    import_path: $ => choice(
      seq(
        field('relative', '.'),
        optional(seq(
          $.import_path_segment,
          repeat(seq(
            '.',
            $.import_path_segment
          ))
        ))
      ),
      seq(
        $.import_path_segment,
        repeat(seq(
          '.',
          $.import_path_segment
        ))
      )
    ),

    import_path_segment: $ => seq(
      $.identifier,
      repeat(choice(
        '-',
        $.number,
        $.identifier
      ))
    ),

    import_as: $ => seq(
      'as',
      $.identifier
    ),

    js_import_statement: $ => prec(1, seq(
      'import',
      choice(
        seq(
          '{',
          commaSep($.identifier),
          '}',
        ),
        seq(
          commaSep($.identifier)
        ),
        seq('*', 'as', $.identifier)
      ),
      'from',
      field('source', $.string)
    )),

    // component is part of expresison, and component_declaration is part of statement (just like class)

    component: $ => seq(
      repeat(field('decorator', $.decorator)),
      choice(
        seq(
          'component',
          optional(field('name', $.identifier)),
          optional(field('heritage', $.component_heritage))
        ),
        field('heritage', $.component_short_heritage)
      ),
      optional(field('id', $.component_identifier)),
      field('body', $.component_body)
    ),

    component_declaration: $ => prec.left('declaration', seq(
      repeat(field('decorator', $.decorator)),
      choice(
        seq(
          'component',
          optional(field('name', $.identifier)),
          optional(field('heritage', $.component_heritage))
        ),
        field('heritage', $.component_short_heritage)
      ),
      optional(field('id', $.component_identifier)),
      field('body', $.component_body),
      optional($._automatic_semicolon)
    )),

    component_short_heritage: $ => seq(
      '&',
      $.identifier,
      optional(repeat(seq(
        '.',
        $.identifier
      )))
    ),

    component_heritage: $ => seq(
      '<', 
      $.identifier,
      optional(repeat(seq(
        '.',
        $.identifier
      )))
    ),
    
    component_identifier: $ => seq('#', $.identifier),
    component_instance: $ => seq('instance', $.identifier),
    component_instance_statement: $ => seq(
      $.component_instance,
      $.new_component_expression
    ),
    
    new_component_expression: $ => seq(
      field('name', choice(
        $.nested_identifier,
        $.identifier
      )),
      optional($.component_identifier),
      $.new_component_body,
      optional(field('arguments', optional($.arguments)))
    ),

    new_tagged_component_expression: $ => seq(
      field('name', choice(
        $.nested_identifier,
        $.identifier
      )),
      optional($.component_identifier),
      $.tagged_type_string
    ),

    new_tripple_tagged_component_expression: $=> seq(
      field('name', choice(
        $.nested_identifier,
        $.identifier
      )),
      optional($.component_identifier),
      $.tripple_tagged_type_string
    ),
    
    component_body: $ => seq(
      '{',
      repeat(choice(
        seq(field('member', $.constructor_definition), optional(';')),
        seq(field('member', $.event_declaration), optional(';')),
        seq(field('member', $.listener_declaration), optional(';')),
        seq(field('member', $.typed_method_declaration), optional(';')),
        seq(field('member', $.property_declaration), optional(';')),
        seq(field('member', $.property_accessor_declaration), optional(';')),
        seq(field('member', $.static_property_declaration), optional(';')),
        seq(field('member', $.identifier_property_assignment), optional(';')),
        seq(field('member', $.property_assignment), optional(';')),
        seq(field('member', $.new_component_expression), optional(';')),
        seq(field('member', $.new_tagged_component_expression), optional(';')),
        seq(field('member', $.new_tripple_tagged_component_expression), optional(';')),
      )),
      '}'
    ),

    new_component_body: $ => seq(
      '{',
      repeat(choice(
        seq(field('member', $.event_declaration), optional(';')),
        seq(field('member', $.listener_declaration), optional(';')),
        seq(field('member', $.typed_method_declaration), optional(';')),
        seq(field('member', $.property_declaration), optional(';')),
        seq(field('member', $.identifier_property_assignment), optional(';')),
        seq(field('member', $.property_assignment), optional(';')),
        seq(field('member', $.new_component_expression), optional(';')),
        seq(field('member', $.new_tagged_component_expression), optional(';')),
        seq(field('member', $.new_tripple_tagged_component_expression), optional(';')),
      )),
      '}'
    ),

    constructor_definition: $ => seq(
      'constructor',
      field('parameters', $.formal_type_parameters),
      field('body', $.statement_block)
    ),

    tagged_type_string: $ => seq(
      '`',
      repeat(choice(
        $._template_chars,
        $.escape_sequence,
        $.template_substitution
      )),
      '`'
    ),

    tripple_tagged_type_string: $ => seq(
      '```',
      repeat(choice(
        $._template_chars,
        $.escape_sequence,
        $.template_substitution
      )),
      '```'
    ),

    formal_type_parameters: $ => seq(
      '(',
      optional(seq(
        commaSep1($.formal_type_parameter),
        optional(',')
      )),
      ')'
    ),

    required_type_parameter: $ => seq(
      field('name', $.identifier),
      field('type', $.type_annotation),
      optional($._initializer)
    ),

    optional_type_parameter: $ => seq(
      field('name', $.identifier),
      '?',
      field('type', $.type_annotation),
      optional($._initializer)
    ),

    formal_type_parameter: $ => choice(
      $.required_type_parameter,
      $.optional_type_parameter
    ),

    property_declaration_name: $ => $.identifier,

    type_narrow: $ => choice(
      $.parenthesized_type,
      $.generic_type,
      $.array_type,
      $._type_identifier,
      $.predefined_type
    ),

    property_declaration: $ => prec.left(choice(
      seq(
      'prop',
      field('name', $.property_declaration_name),
      optional(seq(
        ':',
        optional(field('type', $.type_narrow)),
        choice(
          field('assignment', '='),
          field('binding_assignemnt', ':')
        ),
        choice(
          $.property_assignment_expression,
          $.statement_block
        )
      ))
      ),
      seq(
        field('type', $.type_narrow),
        field('name', $.property_declaration_name),
        optional(seq(
          choice(
            field('assignment', '='),
            field('binding_assignemnt', ':')
          ),
          choice(
            $.property_assignment_expression,
            $.statement_block
          ) 
        ))
      )
    )),

    property_expression_initializer: $ => seq(
      '=',
      field('value', $.expression)
    ),

    static_property_declaration: $ => seq(
      'static',
      choice(
        seq(
          'prop',
          field('name', $.property_declaration_name),
          optional(seq(
            ':',
            optional(field('type', $.type_narrow)),
            $.property_expression_initializer
          ))
        ),
        seq(
          field('type', $.type_narrow),
          field('name', $.property_declaration_name),
          optional($.property_expression_initializer)
        )
      )

      // '',
      // field('type', $.identifier),
      // field('name', $.property_declaration_name),
      // optional($.property_expression_initializer)
    ),

    identifier_property_assignment: $ => seq(
      field('name', 'id'),
      ':',
      $.identifier
    ),

    property_assignment_name: $ => $.nested_identifier,
    
    property_assignment: $ => 
      seq(field('name', choice(
        $.nested_identifier,
        $.identifier
      )),
      choice(
        field('assignment', '='),
        field('binding_assignemnt', ':')
      ),
      choice(
        $.property_assignment_expression,
        $.statement_block
      )
    ),

    event_declaration: $ => seq(
      'event',
      field('name', $.identifier),
      field('parameters', $.formal_type_parameters)
    ),

    typed_function_return_type: $ => $.type_annotation,

    property_accessor_declaration: $ => seq(
      choice(
        seq(
          'get',
          field('name', $.identifier),
          '(',
          ')',
          optional(field('return', $.typed_function_return_type)),
          field('body', $.statement_block)
        ),
        seq(
          'set',
          field('name', $.identifier),
          field('parameters', $.formal_type_parameters),
          field('body', $.statement_block)
        )
      )
    ),

    typed_method_declaration: $ => seq(
      optional('static'),
      optional('async'),
      'fn',
      field('name', $.identifier),
      field('parameters', $.formal_type_parameters),
      optional(field('return', $.typed_function_return_type)),
      field('body', $.statement_block)
    ),

    listener_declaration: $ => seq(
      'on',
      field('name', $._property_name),
      ':',
      field('parameters', $.formal_parameters),
      '=>',
      field('body', choice(
        $.expression,
        $.statement_block
      ))
    ),


    rest_parameter: $ => seq(
      '...',
      choice(
        $.identifier,
        $._destructuring_pattern,
      )
    ),
  }

})
