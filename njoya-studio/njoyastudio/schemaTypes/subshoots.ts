export default {
  name: 'subShoots',
  title: 'Magazine SubShoots',
  type: 'document',
  groups: [
    {name: 'main', title: 'New Credits'},
    {name: 'legacy', title: 'Legacy Credits (read-only, for reference only)'},
  ],
  fields: [
    {
      name: 'magName',
      type: 'string',
      title: 'Magazine Name',
      group: 'main',
    },
    {
      name: 'magEdition',
      type: 'string',
      title: 'Magazine Edition',
      group: 'main',
    },
    {
      name: 'slug',
      title: 'URL Link',
      type: 'slug',
      group: 'legacy',
      hidden: true,
      description: 'Decoupled from Magazine Edition — kept in the background for future use.',
      options: {
        maxLength: 96,
      },
    },
    {
      name: 'edition',
      title: 'Edition (legacy slug)',
      type: 'slug',
      group: 'legacy',
      readOnly: true,
      hidden: true,
      description: 'Legacy slug field — kept only to silence "Unknown field" warnings.',
    },
    {
      name: 'credits',
      title: 'Credits',
      type: 'array',
      group: 'main',
      description:
        'Add as many credits as needed. Pick a preset role or choose "Other" to type a custom role.',
      of: [{type: 'credit'}],
    },
    {
      name: 'magPhotographer',
      type: 'string',
      title: 'Magazine Photographer',
      group: 'legacy',
      readOnly: true,
      description: 'Legacy field — copy this value into the new Credits array, then leave blank.',
    },
    {
      name: 'magTalent',
      type: 'string',
      title: 'Magazine Talent',
      group: 'legacy',
      readOnly: true,
      description: 'Legacy field — copy this value into the new Credits array, then leave blank.',
    },
    {
      name: 'magStylist',
      type: 'string',
      title: 'Magazine Stylist',
      group: 'legacy',
      readOnly: true,
      description: 'Legacy field — copy this value into the new Credits array, then leave blank.',
    },
    {
      name: 'magAssistant',
      type: 'string',
      title: 'Magazine Assistant',
      group: 'legacy',
      readOnly: true,
      description: 'Legacy field — copy this value into the new Credits array, then leave blank.',
    },
    {
      name: 'magOthers',
      type: 'string',
      title: 'Magazine Others',
      group: 'legacy',
      readOnly: true,
      description: 'Legacy field — copy this value into the new Credits array, then leave blank.',
    },
    {
      name: 'magDate',
      type: 'date',
      title: 'Magazine Date',
    },
    {
      name: 'magCover',
      type: 'image',
      title: 'Magazine Cover Image',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magCoverVideo',
      type: 'mux.video',
      title: 'Magazine Cover Video',
    },
    {
      name: 'magImage1',
      type: 'image',
      title: 'Magazine Book Image #1',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage2',
      type: 'image',
      title: 'Magazine Book Image #2',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage3',
      type: 'image',
      title: 'Magazine Book Image #3',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage4',
      type: 'image',
      title: 'Magazine Book Image #4',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage5',
      type: 'image',
      title: 'Magazine Book Image #5',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage6',
      type: 'image',
      title: 'Magazine Book Image #6',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage7',
      type: 'image',
      title: 'Magazine Book Image #7',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage8',
      type: 'image',
      title: 'Magazine Book Image #8',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage9',
      type: 'image',
      title: 'Magazine Book Image #9',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage10',
      type: 'image',
      title: 'Magazine Book Image #10',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage11',
      type: 'image',
      title: 'Magazine Book Image #11',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage12',
      type: 'image',
      title: 'Magazine Book Image #12',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage13',
      type: 'image',
      title: 'Magazine Book Image #13',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage14',
      type: 'image',
      title: 'Magazine Book Image #14',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage15',
      type: 'image',
      title: 'Magazine Book Image #15',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage16',
      type: 'image',
      title: 'Magazine Book Image #16',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage17',
      type: 'image',
      title: 'Magazine Book Image #17',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage18',
      type: 'image',
      title: 'Magazine Book Image #18',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage19',
      type: 'image',
      title: 'Magazine Book Image #19',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage20',
      type: 'image',
      title: 'Magazine Book Image #20',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage21',
      type: 'image',
      title: 'Magazine Book Image #21',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage22',
      type: 'image',
      title: 'Magazine Book Image #22',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage23',
      type: 'image',
      title: 'Magazine Book Image #23',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage24',
      type: 'image',
      title: 'Magazine Book Image #24',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage25',
      type: 'image',
      title: 'Magazine Book Image #25',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage26',
      type: 'image',
      title: 'Magazine Book Image #26',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage27',
      type: 'image',
      title: 'Magazine Book Image #27',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage28',
      type: 'image',
      title: 'Magazine Book Image #28',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage29',
      type: 'image',
      title: 'Magazine Book Image #29',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage30',
      type: 'image',
      title: 'Magazine Book Image #30',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage31',
      type: 'image',
      title: 'Magazine Book Image #31',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage32',
      type: 'image',
      title: 'Magazine Book Image #32',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage33',
      type: 'image',
      title: 'Magazine Book Image #33',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage34',
      type: 'image',
      title: 'Magazine Book Image #34',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage35',
      type: 'image',
      title: 'Magazine Book Image #35',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage36',
      type: 'image',
      title: 'Magazine Book Image #36',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage37',
      type: 'image',
      title: 'Magazine Book Image #37',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage38',
      type: 'image',
      title: 'Magazine Book Image #38',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage39',
      type: 'image',
      title: 'Magazine Book Image #39',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage40',
      type: 'image',
      title: 'Magazine Book Image #40',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage41',
      type: 'image',
      title: 'Magazine Book Image #41',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage42',
      type: 'image',
      title: 'Magazine Book Image #42',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage43',
      type: 'image',
      title: 'Magazine Book Image #43',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage44',
      type: 'image',
      title: 'Magazine Book Image #44',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage45',
      type: 'image',
      title: 'Magazine Book Image #45',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage46',
      type: 'image',
      title: 'Magazine Book Image #46',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage47',
      type: 'image',
      title: 'Magazine Book Image #47',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage48',
      type: 'image',
      title: 'Magazine Book Image #48',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage49',
      type: 'image',
      title: 'Magazine Book Image #49',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magImage50',
      type: 'image',
      title: 'Magazine Book Image #50',
      option: {
        hotspot: true,
      },
      fields: [
        {
          type: 'text',
          name: 'alt',
          title: 'Alternative Text',
        },
      ],
    },
    {
      name: 'magVideo1',
      type: 'mux.video',
      title: 'Magazine Video #1',
    },
    {
      name: 'magVideo2',
      type: 'mux.video',
      title: 'Magazine Video #2',
    },
    {
      name: 'magVideo3',
      type: 'mux.video',
      title: 'Magazine Video #3',
    },
    {
      name: 'magVideo4',
      type: 'mux.video',
      title: 'Magazine Video #4',
    },
    {
      name: 'magVideo5',
      type: 'mux.video',
      title: 'Magazine Video #5',
    },
  ],
}
