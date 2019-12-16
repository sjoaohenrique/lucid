/*
 * @adonisjs/lucid
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import knex from 'knex'
import { QueryClientContract } from '@ioc:Adonis/Lucid/Database'
import { ModelConstructorContract, ModelContract } from '@ioc:Adonis/Lucid/Model'
import { RelationBaseQueryBuilderContract } from '@ioc:Adonis/Lucid/Relations'

import { BelongsTo } from './index'
import { getValue, unique } from '../../../utils'
import { BaseQueryBuilder } from '../Base/QueryBuilder'

export class BelongsToQueryBuilder extends BaseQueryBuilder implements RelationBaseQueryBuilderContract<
ModelConstructorContract,
ModelConstructorContract
> {
  constructor (
    private builder: knex.QueryBuilder,
    private models: ModelContract | ModelContract[],
    client: QueryClientContract,
    private relation: BelongsTo,
  ) {
    super(builder, client, relation, (userFn) => {
      return (__builder) => {
        userFn(new BelongsToQueryBuilder(__builder, this.models, this.client, this.relation))
      }
    })
  }

  public applyConstraints () {
    if (this.$appliedConstraints) {
      return
    }

    this.$appliedConstraints = true
    const queryAction = this.$queryAction()

    /**
     * Eager query contraints
     */
    if (Array.isArray(this.models)) {
      this.builder.whereIn(this.relation.$localCastAsKey, unique(this.models.map((model) => {
        return getValue(model, this.relation.$foreignKey, this.relation, queryAction)
      })))
      return
    }

    /**
     * Query constraints
     */
    const value = getValue(this.models, this.relation.$foreignKey, this.relation, queryAction)
    this.builder.where(this.relation.$localCastAsKey, value)

    /**
     * Do not add limit when updating or deleting
     */
    if (!['update', 'delete'].includes(queryAction)) {
      this.builder.limit(1)
    }
  }
}
