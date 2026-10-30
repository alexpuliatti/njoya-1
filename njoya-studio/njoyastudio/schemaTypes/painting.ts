
export default {
    name: 'paintings',
    title: 'Paintings',
    type: 'document',
    fields: [
        {
            name: 'paintingName',
            type: 'string',
            title: 'Painting Name',
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
              source: 'paintingName',
              maxLength: 156,
            },
        },
        {
            name: 'paintingType',
            type: 'string',
            title: 'Painting Type, Quantity, Size, Color, Material, etc',
        },
        {
            name: 'paintingDescription',
            type: 'string',
            title: 'Painting Description',
        },
        {
            name: 'paintingDate',
            title: 'Date Painting Created',
            type: 'date',
            validation: (rule: any) => rule.required(),
        },
        {
            name: 'paintingImage1',
            type: 'image',
            title: 'Painting Image #1',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage2',
            type: 'image',
            title: 'Painting Image #2',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage3',
            type: 'image',
            title: 'Painting Image #3',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'dpaintingImage4',
            type: 'image',
            title: 'Painting Image #4',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage5',
            type: 'image',
            title: 'Painting Image #5',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage6',
            type: 'image',
            title: 'Painting Image #6',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage7',
            type: 'image',
            title: 'Painting Image #7',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage8',
            type: 'image',
            title: 'Painting Image #8',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage9',
            type: 'image',
            title: 'Painting Image #9',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage10',
            type: 'image',
            title: 'Painting Image #10',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage11',
            type: 'image',
            title: 'Painting Image #11',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage12',
            type: 'image',
            title: 'Painting Image #12',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage13',
            type: 'image',
            title: 'Painting Image #13',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'paintingImage14',
            type: 'image',
            title: 'Painting Image #14',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
    ]
  }
  