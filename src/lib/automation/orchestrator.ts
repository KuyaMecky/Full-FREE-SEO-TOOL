import { prisma } from "@/lib/db";
import { generateContentIdeas } from "@/lib/ai/content";
import { writeArticle } from "@/lib/ai/write";
import { fetchSitemapForProperty } from "@/lib/content/sitemap";

export interface AutomationResult {
  success: boolean;
  itemsProcessed: number;
  itemsFailed: number;
  message: string;
  errors: string[];
  duration: number;
}

export async function runContentAutomation(
  automationId: string
): Promise<AutomationResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    const automation = await prisma.contentAutomation.findUnique({
      where: { id: automationId },
      include: { property: true, wpConnection: true },
    });

    if (!automation) {
      return {
        success: false,
        itemsProcessed: 0,
        itemsFailed: 0,
        message: "Automation not found",
        errors: ["Automation not found"],
        duration: Date.now() - startTime,
      };
    }

    if (!automation.enabled) {
      return {
        success: false,
        itemsProcessed: 0,
        itemsFailed: 0,
        message: "Automation is disabled",
        errors: ["Automation is disabled"],
        duration: Date.now() - startTime,
      };
    }

    let itemsProcessed = 0;
    let itemsFailed = 0;

    // Step 1: Generate content ideas
    if (automation.autoGenerateIdeas) {
      try {
        const existingIdeas = await prisma.generatedContentIdea.findMany({
          where: {
            automationId,
            status: { in: ["pending", "draft_created"] },
          },
        });

        // Only generate new ideas if we don't have many pending
        if (existingIdeas.length < 10) {
          const plan = await generateContentIdeas({
            domain: automation.property.siteUrl
              .replace(/^sc-domain:/, "")
              .replace(/^https?:\/\//, "")
              .replace(/\/$/, ""),
            businessType: automation.businessType || undefined,
            seedTopics: JSON.parse(automation.seedTopics || "[]"),
            existingUrls: [], // Could fetch from sitemap, but optional
          });

          const allIdeas = [
            ...plan.quickWinIdeas,
            ...plan.topicExpansions,
            ...plan.newPillarIdeas,
          ];

          for (const idea of allIdeas.slice(0, automation.maxDraftsPerRun)) {
            try {
              await prisma.generatedContentIdea.create({
                data: {
                  automationId,
                  title: idea.title,
                  targetKeyword: idea.targetKeyword,
                  intent: idea.intent,
                  difficulty: idea.difficulty,
                  outline: JSON.stringify(idea.outline),
                  rationale: idea.rationale,
                  estimatedWordCount: idea.estimatedWordCount,
                  suggestedSlug: idea.suggestedSlug,
                  internalLinkTargets: JSON.stringify(idea.internalLinkTargets || []),
                  status: "pending",
                },
              });
              itemsProcessed++;
            } catch (e) {
              itemsFailed++;
              errors.push(`Failed to create idea: ${(e as Error).message}`);
            }
          }
        }
      } catch (e) {
        errors.push(`Idea generation failed: ${(e as Error).message}`);
      }
    }

    // Step 2: Create drafts from pending ideas
    if (automation.autoDraftIdeas) {
      const pendingIdeas = await prisma.generatedContentIdea.findMany({
        where: {
          automationId,
          status: "pending",
        },
        take: automation.maxDraftsPerRun,
      });

      for (const idea of pendingIdeas) {
        try {
          const draft = await prisma.contentDraft.create({
            data: {
              userId: automation.userId,
              propertyId: automation.propertyId,
              wpConnectionId: automation.wpConnectionId || null,
              title: idea.title,
              slug: idea.suggestedSlug,
              metaTitle: idea.title,
              metaDescription: "",
              focusKeyword: idea.targetKeyword,
              content: "", // Will be filled in write step
              internalLinks: JSON.stringify([]),
              imageSuggestions: JSON.stringify([]),
            },
          });

          await prisma.generatedContentIdea.update({
            where: { id: idea.id },
            data: {
              draftId: draft.id,
              status: "draft_created",
            },
          });

          itemsProcessed++;
        } catch (e) {
          itemsFailed++;
          errors.push(`Failed to create draft: ${(e as Error).message}`);
        }
      }
    }

    // Step 3: Write content for drafts
    if (automation.autoWriteContent) {
      const draftIdeas = await prisma.generatedContentIdea.findMany({
        where: {
          automationId,
          status: "draft_created",
          draftId: { not: null },
        },
        include: { draft: true },
        take: automation.maxDraftsPerRun,
      });

      for (const idea of draftIdeas) {
        try {
          if (!idea.draft) continue;

          const article = await writeArticle({
            title: idea.title,
            targetKeyword: idea.targetKeyword,
            outline: JSON.parse(idea.outline || "[]"),
            intent: idea.intent,
            estimatedWordCount: idea.estimatedWordCount,
            domain: automation.property.siteUrl
              .replace(/^sc-domain:/, "")
              .replace(/^https?:\/\//, "")
              .replace(/\/$/, ""),
            internalLinkTargets: JSON.parse(idea.internalLinkTargets || "[]"),
          });

          await prisma.contentDraft.update({
            where: { id: idea.draft.id },
            data: {
              content: article.content,
              metaTitle: article.metaTitle,
              metaDescription: article.metaDescription,
              schemaMarkup: article.schemaMarkup,
              internalLinks: JSON.stringify(article.internalLinks),
              imageSuggestions: JSON.stringify(article.imageSuggestions),
              status: "review",
            },
          });

          await prisma.generatedContentIdea.update({
            where: { id: idea.id },
            data: { status: "written" },
          });

          itemsProcessed++;
        } catch (e) {
          itemsFailed++;
          errors.push(`Failed to write content: ${(e as Error).message}`);
        }
      }
    }

    // Step 4: Schedule publishing
    if (automation.autoSchedulePublish && automation.wpConnectionId) {
      const writtenIdeas = await prisma.generatedContentIdea.findMany({
        where: {
          automationId,
          status: "written",
          draftId: { not: null },
        },
        include: { draft: true },
        take: automation.maxDraftsPerRun,
      });

      for (const idea of writtenIdeas) {
        try {
          if (!idea.draft) continue;

          const scheduledAt = new Date();
          scheduledAt.setDate(
            scheduledAt.getDate() + automation.scheduleAfterDays
          );

          await prisma.contentDraft.update({
            where: { id: idea.draft.id },
            data: {
              status: "ready",
              scheduledAt,
            },
          });

          await prisma.generatedContentIdea.update({
            where: { id: idea.id },
            data: { status: "scheduled" },
          });

          itemsProcessed++;
        } catch (e) {
          itemsFailed++;
          errors.push(`Failed to schedule: ${(e as Error).message}`);
        }
      }
    }

    // Log the run
    await prisma.automationLog.create({
      data: {
        automationId,
        runType: "full_run",
        status: itemsFailed === 0 ? "success" : "partial",
        itemsProcessed,
        itemsFailed,
        message: `Processed ${itemsProcessed} items, ${itemsFailed} failures`,
        errorDetails: JSON.stringify(errors),
        duration: Date.now() - startTime,
      },
    });

    // Update automation last run
    await prisma.contentAutomation.update({
      where: { id: automationId },
      data: { lastRunAt: new Date() },
    });

    return {
      success: itemsFailed === 0,
      itemsProcessed,
      itemsFailed,
      message: `Processed ${itemsProcessed} items${itemsFailed > 0 ? `, ${itemsFailed} failures` : ""}`,
      errors,
      duration: Date.now() - startTime,
    };
  } catch (e) {
    const error = (e as Error).message;
    return {
      success: false,
      itemsProcessed: 0,
      itemsFailed: 0,
      message: `Automation failed: ${error}`,
      errors: [error],
      duration: Date.now() - startTime,
    };
  }
}

export async function getAutomationStatus(
  automationId: string
): Promise<{
  automation: any;
  stats: {
    totalIdeas: number;
    pendingIdeas: number;
    draftedIdeas: number;
    writtenIdeas: number;
    scheduledIdeas: number;
    publishedIdeas: number;
  };
  lastRuns: any[];
}> {
  const automation = await prisma.contentAutomation.findUnique({
    where: { id: automationId },
    include: { property: true, wpConnection: true },
  });

  if (!automation) {
    throw new Error("Automation not found");
  }

  const ideas = await prisma.generatedContentIdea.groupBy({
    by: ["status"],
    where: { automationId },
    _count: true,
  });

  const stats = {
    totalIdeas: ideas.reduce((sum, g) => sum + g._count, 0),
    pendingIdeas: ideas.find((g) => g.status === "pending")?._count || 0,
    draftedIdeas: ideas.find((g) => g.status === "draft_created")?._count || 0,
    writtenIdeas: ideas.find((g) => g.status === "written")?._count || 0,
    scheduledIdeas: ideas.find((g) => g.status === "scheduled")?._count || 0,
    publishedIdeas: ideas.find((g) => g.status === "published")?._count || 0,
  };

  const lastRuns = await prisma.automationLog.findMany({
    where: { automationId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return { automation, stats, lastRuns };
}
