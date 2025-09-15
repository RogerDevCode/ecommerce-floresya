export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Find the FloresYaApp class
  root.find(j.ClassDeclaration, {
    id: {
      name: 'FloresYaApp'
    }
  }).forEach(classPath => {
    // Find the getCarouselProducts method
    j(classPath).find(j.MethodDefinition, {
      key: {
        name: 'getCarouselProducts'
      }
    }).forEach(methodPath => {
      const body = methodPath.node.body;

      // 1. Change API response handling: const { data, error } => const response
      j(body).find(j.VariableDeclarator, {
        id: {
          type: 'ObjectPattern',
          properties: [
            { key: { name: 'data' } },
            { key: { name: 'error' } }
          ]
        },
        init: {
          type: 'AwaitExpression',
          argument: {
            type: 'CallExpression',
            callee: {
              property: { name: 'getCarouselProducts' }
            }
          }
        }
      }).replaceWith(path => {
        return j.variableDeclarator(
          j.identifier('response'),
          path.node.init
        );
      });

      // 2. Change error check: if (error) => if (!response.success || !response.data)
      j(body).find(j.IfStatement, {
        test: {
          type: 'Identifier',
          name: 'error'
        }
      }).replaceWith(path => {
        return j.ifStatement(
          j.logicalExpression(
            '||',
            j.unaryExpression('!', j.memberExpression(j.identifier('response'), j.identifier('success'))),
            j.unaryExpression('!', j.memberExpression(j.identifier('response'), j.identifier('data')))
          ),
          path.node.consequent
        );
      });

      // 3. Change map source: (data || []) => (response.data.carousel_products || [])
      j(body).find(j.CallExpression, {
        callee: {
          property: { name: 'map' }
        },
        arguments: [
          j.ArrowFunctionExpression
        ]
      }).filter(path => {
        // Ensure we are targeting the map call on the API response data
        const calleeObject = path.node.callee.object;
        return j(calleeObject).toSource().includes('data || []');
      }).replaceWith(path => {
        const newCalleeObject = j.logicalExpression(
          '||',
          j.memberExpression(
            j.memberExpression(j.identifier('response'), j.identifier('data')),
            j.identifier('carousel_products')
          ),
          j.arrayExpression([])
        );
        return j.callExpression(
          j.memberExpression(newCalleeObject, j.identifier('map')),
          path.node.arguments
        );
      });

      // 4. Fix image access within the map function
      j(body).find(j.ArrowFunctionExpression, {
        params: [{ name: 'product' }]
      }).forEach(arrowPath => {
        j(arrowPath).find(j.CallExpression, {
          callee: {
            property: { name: 'forEach' }
          },
          arguments: [
            j.ArrowFunctionExpression
          ]
        }).filter(path => {
          // Ensure this is the product.product_images?.forEach
          return j(path.node.callee.object).toSource().includes('product.product_images');
        }).replaceWith(path => {
          // Replace the entire forEach block with the new if block
          return j.ifStatement(
            j.memberExpression(j.identifier('product'), j.identifier('primary_image_urls')),
            j.blockStatement([
              j.expressionStatement(
                j.assignmentExpression(
                  '=',
                  j.memberExpression(j.identifier('imageUrls'), j.identifier('thumb')),
                  j.logicalExpression(
                    '||',
                    j.memberExpression(j.memberExpression(j.identifier('product'), j.identifier('primary_image_urls')), j.identifier('thumb')),
                    j.stringLiteral('')
                  )
                )
              ),
              j.expressionStatement(
                j.assignmentExpression(
                  '=',
                  j.memberExpression(j.identifier('imageUrls'), j.identifier('small')),
                  j.logicalExpression(
                    '||',
                    j.memberExpression(j.memberExpression(j.identifier('product'), j.identifier('primary_image_urls')), j.identifier('small')),
                    j.stringLiteral('')
                  )
                )
              ),
              j.expressionStatement(
                j.assignmentExpression(
                  '=',
                  j.memberExpression(j.identifier('imageUrls'), j.identifier('medium')),
                  j.logicalExpression(
                    '||',
                    j.memberExpression(j.memberExpression(j.identifier('product'), j.identifier('primary_image_urls')), j.identifier('medium')),
                    j.stringLiteral('')
                  )
                )
              ),
              j.expressionStatement(
                j.assignmentExpression(
                  '=',
                  j.memberExpression(j.identifier('imageUrls'), j.identifier('large')),
                  j.logicalExpression(
                    '||',
                    j.memberExpression(j.memberExpression(j.identifier('product'), j.identifier('primary_image_urls')), j.identifier('large')),
                    j.stringLiteral('')
                  )
                )
              )
            ])
          );
        });
      });

      // 5. Change total_count: carouselProducts.length => total_count: response.data.total_count
      j(body).find(j.Property, {
        key: { name: 'total_count' },
        value: {
          type: 'MemberExpression',
          object: { name: 'carouselProducts' },
          property: { name: 'length' }
        }
      }).replaceWith(path => {
        return j.property(
          'init',
          j.identifier('total_count'),
          j.memberExpression(
            j.memberExpression(j.identifier('response'), j.identifier('data')),
            j.identifier('total_count')
          )
        );
      });
    });
  });

  return root.toSource();
}