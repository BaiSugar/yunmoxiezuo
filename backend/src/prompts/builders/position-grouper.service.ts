import { Injectable, Logger } from '@nestjs/common';
import {
  PromptComponent,
  PositionBucket,
} from '../interfaces/prompt-component.interface';
import { PromptPosition } from '../enums/position.enum';

/**
 * 位置分组服务
 * 负责将组件按位置分组到不同的"桶"中（阶段2）
 */
@Injectable()
export class PositionGrouperService {
  private readonly logger = new Logger(PositionGrouperService.name);

  /**
   * 将组件数组分组到位置桶
   * @param components 组件数组
   * @returns 位置桶
   */
  groupByPosition(components: PromptComponent[]): PositionBucket {
    const bucket: PositionBucket = {
      systemPrompts: [],
      beforeChar: [],
      charDef: [],
      afterChar: [],
      exampleTop: [],
      examples: [],
      exampleBottom: [],
      history: [],
      depthInjections: [],
      anTop: [],
      anBottom: [],
      latestInput: [],
    };

    for (const component of components) {
      switch (component.position) {
        case PromptPosition.SYSTEM:
          bucket.systemPrompts.push(component);
          break;

        case PromptPosition.BEFORE_CHAR:
          bucket.beforeChar.push(component);
          break;

        case PromptPosition.CHAR_DEF:
          bucket.charDef.push(component);
          break;

        case PromptPosition.AFTER_CHAR:
          bucket.afterChar.push(component);
          break;

        case PromptPosition.EXAMPLE_TOP:
          bucket.exampleTop.push(component);
          break;

        case PromptPosition.EXAMPLES:
          bucket.examples.push(component);
          break;

        case PromptPosition.EXAMPLE_BOTTOM:
          bucket.exampleBottom.push(component);
          break;

        case PromptPosition.HISTORY:
          bucket.history.push(component);
          break;

        case PromptPosition.AT_DEPTH:
          bucket.depthInjections.push(component);
          break;

        case PromptPosition.AN_TOP:
          bucket.anTop.push(component);
          break;

        case PromptPosition.AN_BOTTOM:
          bucket.anBottom.push(component);
          break;

        case PromptPosition.LATEST_INPUT:
          bucket.latestInput.push(component);
          break;

        default:
          this.logger.warn(
            `未知位置: ${component.position}，放入 afterChar 桶`,
          );
          bucket.afterChar.push(component);
      }
    }

    this.logger.debug(`位置分组完成: ${this.getBucketSummary(bucket)}`);

    return bucket;
  }

  /**
   * 对每个桶内的组件进行排序（阶段3）
   * @param bucket 位置桶
   * @returns 排序后的位置桶
   */
  sortBuckets(bucket: PositionBucket): PositionBucket {
    // 对大多数桶按 order 排序
    bucket.systemPrompts = this.sortByOrder(bucket.systemPrompts);
    bucket.beforeChar = this.sortByOrder(bucket.beforeChar);
    bucket.charDef = this.sortByOrder(bucket.charDef);
    bucket.afterChar = this.sortByOrder(bucket.afterChar);
    bucket.exampleTop = this.sortByOrder(bucket.exampleTop);
    bucket.exampleBottom = this.sortByOrder(bucket.exampleBottom);
    bucket.anTop = this.sortByOrder(bucket.anTop);
    bucket.anBottom = this.sortByOrder(bucket.anBottom);

    // 示例消息和历史消息按原始顺序（order字段代表时间顺序）
    bucket.examples = this.sortByOrder(bucket.examples);
    bucket.history = this.sortByOrder(bucket.history);

    // 深度注入按 depth 和 order 排序
    bucket.depthInjections = this.sortDepthInjections(bucket.depthInjections);

    // 最新输入不需要排序（只有一条）
    bucket.latestInput = this.sortByOrder(bucket.latestInput);

    this.logger.debug(`桶内排序完成`);

    return bucket;
  }

  /**
   * 按 order 字段排序组件
   * @param components 组件数组
   * @returns 排序后的组件数组
   */
  private sortByOrder(components: PromptComponent[]): PromptComponent[] {
    return components.sort((a, b) => {
      const orderA = a.order ?? 100;
      const orderB = b.order ?? 100;
      return orderA - orderB;
    });
  }

  /**
   * 对深度注入组件排序（先按depth，后按order）
   * @param components 深度注入组件数组
   * @returns 排序后的组件数组
   */
  private sortDepthInjections(
    components: PromptComponent[],
  ): PromptComponent[] {
    return components.sort((a, b) => {
      const depthA = a.depth ?? 0;
      const depthB = b.depth ?? 0;

      // 先按深度排序
      if (depthA !== depthB) {
        return depthA - depthB;
      }

      // 深度相同，按order排序
      const orderA = a.order ?? 100;
      const orderB = b.order ?? 100;
      return orderA - orderB;
    });
  }

  /**
   * 获取桶的摘要信息（用于日志）
   * @param bucket 位置桶
   * @returns 摘要字符串
   */
  private getBucketSummary(bucket: PositionBucket): string {
    return [
      `system:${bucket.systemPrompts.length}`,
      `beforeChar:${bucket.beforeChar.length}`,
      `charDef:${bucket.charDef.length}`,
      `afterChar:${bucket.afterChar.length}`,
      `exampleTop:${bucket.exampleTop.length}`,
      `examples:${bucket.examples.length}`,
      `exampleBottom:${bucket.exampleBottom.length}`,
      `history:${bucket.history.length}`,
      `depthInject:${bucket.depthInjections.length}`,
      `anTop:${bucket.anTop.length}`,
      `anBottom:${bucket.anBottom.length}`,
      `latestInput:${bucket.latestInput.length}`,
    ].join(', ');
  }
}
