import { describe, expect, it } from 'vitest'
import { buildProjectProposal } from '../src/services/project-proposal.js'

describe('buildProjectProposal', () => {
  it('marks AI and cloud scope as advanced without claiming AI generation', () => {
    const proposal = buildProjectProposal({ title: 'Vision lab', problem: 'Classify images', features: 'AI image classification', projectType: 'AI / ML', budget: 'Not sure yet', stack: { frontend: 'React', backend: 'Python / FastAPI', database: 'MongoDB', optional: ['Cloud deployment'], recommend: true } })
    expect(proposal.complexity).toBe('Advanced')
    expect(proposal.priceRange).toBe('Quote required after clarification')
    expect(proposal.assumptions.length).toBeGreaterThan(0)
  })

  it('uses the student budget and stack preferences transparently', () => {
    const proposal = buildProjectProposal({ title: 'Campus board', problem: 'Share notices', features: 'Search and moderation', projectType: 'Website', budget: '₹2,000 – ₹4,000', stack: { frontend: 'Vue', backend: 'Node.js / Express', database: 'PostgreSQL', optional: [], recommend: false } })
    expect(proposal.priceRange).toBe('₹2,000 – ₹4,000')
    expect(proposal.reasoning).toContain('technology preferences')
  })
})