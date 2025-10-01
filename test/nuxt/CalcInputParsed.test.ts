import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CalcInputParsed from '../../app/components/calc/input/CalcInputParsed.vue'
import { strToMinutesSafe, strFromMinutes } from '../../shared/utils/ComputeWorkTime'
import { BFormInput } from 'bootstrap-vue-next'

describe('CalcInputParsed.vue', () => {
  it('emits parsed values and formats modelValue updates', async () => {
    const wrapper = mount(CalcInputParsed as any, {
      props: {
        modelValue: null,
        parse: strToMinutesSafe,
        format: strFromMinutes,
      },
    })

    const input = wrapper.get('input')

    await input.setValue('01:05')
    const emitted = wrapper.emitted<(number | null | undefined)[]>('update:modelValue')
    expect(emitted[0][0]).toBe(65)

    await wrapper.setProps({ modelValue: 120 })
    expect((input.element as HTMLInputElement).value).toBe('02:00')
  })

  it('handles required flag and invalid inputs (whitespace/plus)', async () => {
    const wrapper = mount(CalcInputParsed as any, {
      props: {
        modelValue: null,
        parse: strToMinutesSafe,
        format: strFromMinutes,
        required: true,
      },
    })

    const input = wrapper.get('input')

    await input.setValue('')
    const lastEmitted = () => {
      const emitted = wrapper.emitted<(number | null | undefined)[]>('update:modelValue')
      expect(emitted).not.toBeUndefined()
      expect(emitted.length).toBeGreaterThan(0)
      return emitted[emitted.length - 1]
    }

    let emitted = wrapper.emitted<(number | null | undefined)[]>('update:modelValue')
    expect(emitted).toBeUndefined()

    const bForm = wrapper.findComponent(BFormInput)
    expect(bForm.props('state')).toBe(false)

    await input.setValue(' 01:00')
    expect(lastEmitted()[0]).toBeUndefined()

    await input.setValue('+01:00')
    expect(lastEmitted()[0]).toBeUndefined()

    await input.setValue('00:30')
    expect(lastEmitted()[0]).toBe(30)
  })
})
