import { defineComponent, h, onUnmounted, inject, ref, Ref, provide, onMounted, PropType, createCommentVNode, reactive } from 'vue'
import XEUtils from 'xe-utils'
import GlobalConfig from '../../v-x-e-table/src/conf'
import { VXETable } from '../../v-x-e-table'
import { getFuncText, isEnableConf } from '../../tools/utils'
import { getSlotVNs } from '../../tools/vn'
import { createItem, watchItem, destroyItem, assemItem, XEFormItemProvide, isActivetem } from './util'
import { renderTitle } from './render'

import { SlotVNodeType, VxeFormConstructor, VxeFormDefines, VxeFormItemPropTypes, VxeFormPrivateMethods } from '../../../types/all'

export const formItemProps = {
  title: String as PropType<VxeFormItemPropTypes.Title>,
  field: String as PropType<VxeFormItemPropTypes.Field>,
  span: [String, Number] as PropType<VxeFormItemPropTypes.Span>,
  align: String as PropType<VxeFormItemPropTypes.Align>,
  titleAlign: {
    type: String as PropType<VxeFormItemPropTypes.TitleAlign>,
    default: null
  },
  titleWidth: {
    type: [String, Number] as PropType<VxeFormItemPropTypes.TitleWidth>,
    default: null
  },
  titleColon: {
    type: Boolean as PropType<VxeFormItemPropTypes.TitleColon>,
    default: null
  },
  titleAsterisk: {
    type: Boolean as PropType<VxeFormItemPropTypes.TitleAsterisk>,
    default: null
  },
  className: [String, Function] as PropType<VxeFormItemPropTypes.ClassName>,
  titleOverflow: {
    type: [Boolean, String] as PropType<VxeFormItemPropTypes.TitleOverflow>,
    default: null
  },
  titlePrefix: Object as PropType<VxeFormItemPropTypes.TitlePrefix>,
  titleSuffix: Object as PropType<VxeFormItemPropTypes.TitleSuffix>,
  resetValue: { default: null },
  visibleMethod: Function as PropType<VxeFormItemPropTypes.VisibleMethod>,
  visible: { type: Boolean as PropType<VxeFormItemPropTypes.Visible>, default: null },
  folding: Boolean as PropType<VxeFormItemPropTypes.Folding>,
  collapseNode: Boolean as PropType<VxeFormItemPropTypes.CollapseNode>,
  itemRender: Object as PropType<VxeFormItemPropTypes.ItemRender>
}

export default defineComponent({
  name: 'VxeFormItem',
  props: formItemProps,
  setup (props, { slots }) {
    const refElem = ref() as Ref<HTMLDivElement>
    const $xeform = inject('$xeform', {} as VxeFormConstructor & VxeFormPrivateMethods)
    const formGather = inject('$xeformgather', null as XEFormItemProvide | null)
    const formItem = reactive(createItem($xeform, props))
    const xeformitem: XEFormItemProvide = { formItem }
    const xeformiteminfo = { itemConfig: formItem }
    formItem.slots = slots

    provide('$xeformiteminfo', xeformiteminfo)
    provide('$xeformitem', xeformitem)
    provide('$xeformgather', null)

    watchItem(props, formItem)

    onMounted(() => {
      assemItem($xeform, refElem.value, formItem, formGather)
    })

    onUnmounted(() => {
      destroyItem($xeform, formItem)
    })

    const renderItem = ($xeform: VxeFormConstructor & VxeFormPrivateMethods, item: VxeFormDefines.ItemInfo) => {
      const { props, reactData } = $xeform
      const { data, rules, titleAlign: allTitleAlign, titleWidth: allTitleWidth, titleColon: allTitleColon, titleAsterisk: allTitleAsterisk, titleOverflow: allTitleOverflow } = props
      const { collapseAll } = reactData
      const { computeValidOpts } = $xeform.getComputeMaps()
      const validOpts = computeValidOpts.value
      const { slots, title, visible, folding, field, collapseNode, itemRender, showError, errRule, className, titleOverflow } = item
      const compConf = isEnableConf(itemRender) ? VXETable.renderer.get(itemRender.name) : null
      const itemClassName = compConf ? compConf.itemClassName : ''
      const itemStyle = compConf ? compConf.itemStyle : null
      const defaultSlot = slots ? slots.default : null
      const titleSlot = slots ? slots.title : null
      const span = item.span || props.span
      const align = item.align || props.align
      const titleAlign = XEUtils.eqNull(item.titleAlign) ? allTitleAlign : item.titleAlign
      const titleWidth = XEUtils.eqNull(item.titleWidth) ? allTitleWidth : item.titleWidth
      const titleColon = XEUtils.eqNull(item.titleColon) ? allTitleColon : item.titleColon
      const titleAsterisk = XEUtils.eqNull(item.titleAsterisk) ? allTitleAsterisk : item.titleAsterisk
      const itemOverflow = (XEUtils.isUndefined(titleOverflow) || XEUtils.isNull(titleOverflow)) ? allTitleOverflow : titleOverflow
      const showEllipsis = itemOverflow === 'ellipsis'
      const showTitle = itemOverflow === 'title'
      const showTooltip = itemOverflow === true || itemOverflow === 'tooltip'
      const hasEllipsis = showTitle || showTooltip || showEllipsis
      const params = { data, field, property: field, item, $form: $xeform, $grid: $xeform.xegrid }
      let isRequired = false
      if (visible === false) {
        return createCommentVNode()
      }
      if (rules) {
        const itemRules = rules[field]
        if (itemRules) {
          isRequired = itemRules.some((rule) => rule.required)
        }
      }
      let contentVNs: SlotVNodeType[] = []
      if (defaultSlot) {
        contentVNs = $xeform.callSlot(defaultSlot, params)
      } else if (compConf && compConf.renderItemContent) {
        contentVNs = getSlotVNs(compConf.renderItemContent(itemRender, params))
      } else if (field) {
        contentVNs = [`${XEUtils.get(data, field)}`]
      }
      if (collapseNode) {
        contentVNs.push(
          h('div', {
            class: 'vxe-form--item-trigger-node',
            onClick: $xeform.toggleCollapseEvent
          }, [
            h('span', {
              class: 'vxe-form--item-trigger-text'
            }, collapseAll ? GlobalConfig.i18n('vxe.form.unfolding') : GlobalConfig.i18n('vxe.form.folding')),
            h('i', {
              class: ['vxe-form--item-trigger-icon', collapseAll ? GlobalConfig.icon.FORM_FOLDING : GlobalConfig.icon.FORM_UNFOLDING]
            })
          ])
        )
      }
      if (errRule && validOpts.showMessage) {
        contentVNs.push(
          h('div', {
            class: 'vxe-form--item-valid',
            style: errRule.maxWidth ? {
              width: `${errRule.maxWidth}px`
            } : null
          }, errRule.message)
        )
      }
      const ons = showTooltip ? {
        onMouseenter (evnt: MouseEvent) {
          $xeform.triggerTitleTipEvent(evnt, params)
        },
        onMouseleave: $xeform.handleTitleTipLeaveEvent
      } : {}
      return h('div', {
        ref: refElem,
        class: [
          'vxe-form--item',
          item.id,
          span ? `vxe-col--${span} is--span` : '',
          className ? (XEUtils.isFunction(className) ? className(params) : className) : '',
          itemClassName ? (XEUtils.isFunction(itemClassName) ? itemClassName(params) : itemClassName) : '',
          {
            'is--title': title,
            'is--colon': titleColon,
            'is--asterisk': titleAsterisk,
            'is--required': isRequired,
            'is--hidden': folding && collapseAll,
            'is--active': isActivetem($xeform, item),
            'is--error': showError
          }
        ],
        style: XEUtils.isFunction(itemStyle) ? itemStyle(params) : itemStyle
      }, [
        h('div', {
          class: 'vxe-form--item-inner'
        }, [
          title || titleSlot ? h('div', {
            class: ['vxe-form--item-title', titleAlign ? `align--${titleAlign}` : null, {
              'is--ellipsis': hasEllipsis
            }],
            style: titleWidth ? {
              width: isNaN(titleWidth as number) ? titleWidth : `${titleWidth}px`
            } : null,
            title: showTitle ? getFuncText(title) : null,
            ...ons
          }, renderTitle($xeform, item)) : null,
          h('div', {
            class: ['vxe-form--item-content', align ? `align--${align}` : null]
          }, contentVNs)
        ])
      ])
    }

    const renderVN = () => {
      const formProps = $xeform ? $xeform.props : null
      return formProps && formProps.customLayout ? renderItem($xeform, formItem as unknown as VxeFormDefines.ItemInfo) : h('div', {
        ref: refElem
      })
    }

    const $xeformitem = {
      renderVN
    }

    return $xeformitem
  },
  render () {
    return this.renderVN()
  }
})
