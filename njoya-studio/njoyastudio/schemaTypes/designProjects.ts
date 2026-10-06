export default {
  name: 'designProjects',
  title: 'Design Projects',
  type: 'document',
  groups: [
    {name: 'main', title: 'New Credits'},
    {name: 'legacy', title: 'Legacy Credits (read-only, for reference only)'},
  ],
  fields: [
    {
      name: 'designProjectClient',
      type: 'string',
      title: 'Design Project Client',
      group: 'main',
    },
    {
      name: 'designProjectName',
      type: 'string',
      title: 'Design Project Name',
      group: 'main',
    },
    {
      name: 'designProjectDate',
      title: 'Design Project Date',
      type: 'date',
      group: 'main',
      validation: (rule: any) => rule.required(),
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
      name: 'designProjectType',
      type: 'string',
      title: 'What type of design project?',
      group: 'legacy',
      readOnly: true,
      description:
        'Legacy field — copy this value into the new Credits array using the "Project Type" role, then leave blank.',
    },
    {
      name: 'designProjectLocation',
      type: 'string',
      title: 'Deisgn Project Location',
      group: 'legacy',
      readOnly: true,
      description:
        'Legacy field — copy this value into the new Credits array using the "Location" role, then leave blank.',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (document: any) => `${document.designProjectClient}-${document.designProjectName}`,
        maxLength: 156,
      },
    },
    {
      name: 'designImage1',
      type: 'image',
      title: 'Design Project Image #1',
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
      name: 'designVideo1',
      type: 'mux.video',
      title: 'Design Project Cover Video',
    },
    {
      name: 'designImage2',
      type: 'image',
      title: 'Design Project Image #2',
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
      name: 'designImage3',
      type: 'image',
      title: 'Design Project Image #3',
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
      name: 'designImage4',
      type: 'image',
      title: 'Design Project Image #4',
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
      name: 'designImage5',
      type: 'image',
      title: 'Design Project Image #5',
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
      name: 'designImage6',
      type: 'image',
      title: 'Design Project Image #6',
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
      name: 'designImage7',
      type: 'image',
      title: 'Design Project Image #7',
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
      name: 'designImage8',
      type: 'image',
      title: 'Design Project Image #8',
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
      name: 'designImage9',
      type: 'image',
      title: 'Design Project Image #9',
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
      name: 'designImage10',
      type: 'image',
      title: 'Design Project Image #10',
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
      name: 'designImage11',
      type: 'image',
      title: 'Design Project Image #11',
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
      name: 'designImage12',
      type: 'image',
      title: 'Design Project Image #12',
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
      name: 'designImage13',
      type: 'image',
      title: 'Design Project Image #13',
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
      name: 'designImage14',
      type: 'image',
      title: 'Design Project Image #14',
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
      name: 'designProjectVideo1',
      type: 'mux.video',
      title: 'Design Project Video #1',
    },
    {
      name: 'designProjectVideo2',
      type: 'mux.video',
      title: 'Design Project Video #2',
    },
    {
      name: 'designProjectVideo3',
      type: 'mux.video',
      title: 'Design Project Video #3',
    },
    {
      name: 'designProjectVideo4',
      type: 'mux.video',
      title: 'Design Project Video #4',
    },
    {
      name: 'designProjectVideo5',
      type: 'mux.video',
      title: 'Design Project Video #5',
    },
  ],
}
